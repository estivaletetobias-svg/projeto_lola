import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import officeParser from 'officeparser';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const AI_SYSTEM_PROMPT = `You are an elite payroll data extraction engine. 
You will receive raw text from a payroll document (PDF, Excel, or CSV).
Extract ALL employee rows. Ignore headers, empty rows, totals, and decorative lines.
Ensure salary numbers are floats (e.g., 5000.00 not "5.000,00").
Return a strictly valid JSON object with a single root key 'employees' containing an array.
Each object MUST match exactly:
{
  employee_key: string,   // CPF, ID, or generate unique if missing
  full_name: string,      // full name
  area: string,           // job title, role, or department
  base_salary: number,    // base salary as float
  benefits: number,       // sum of benefits or 0
  variable: number        // sum of variable pay or 0
}`;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const tenantId = (formData.get('tenantId') as string) || 'default';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // --- Use officeParser as the universal engine ---
        let textContent = '';
        try {
            textContent = await officeParser.parseOfficeAsync(buffer);
            // Safety cap for tokens
            textContent = textContent.substring(0, 50000);
        } catch (parseError: any) {
            console.error('Parser error:', parseError);
            return NextResponse.json({ error: `Could not read file: ${parseError.message}` }, { status: 422 });
        }

        if (!textContent || textContent.trim().length < 10) {
            return NextResponse.json({ error: 'The file appears to be empty or unreadable.' }, { status: 422 });
        }

        // --- Call OpenAI ---
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: AI_SYSTEM_PROMPT },
                { role: 'user', content: textContent }
            ],
            temperature: 0,
        });

        const resultText = response.choices[0].message.content;
        if (!resultText) throw new Error('OpenAI returned empty response');

        const jsonResult = JSON.parse(resultText);
        const employees: any[] = jsonResult.employees || [];

        if (employees.length === 0) {
            return NextResponse.json({ error: 'AI could not extract any employee data. Please ensure the file contains payroll records.' }, { status: 422 });
        }

        // --- Proxy to Backend if available ---
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        try {
            const payload = {
                fileName: file.name,
                periodDate: new Date().toISOString(),
                data: employees.map(e => ({
                    nome: e.full_name,
                    cargo: e.area,
                    salario: e.base_salary,
                    id: e.employee_key,
                    beneficios: e.benefits,
                    variavel: e.variable,
                })),
            };

            const backendRes = await fetch(`${backendUrl}/payroll/upload-local`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15000),
            });

            if (backendRes.ok) {
                const result = await backendRes.json();
                return NextResponse.json({
                    status: 'success',
                    count: employees.length,
                    snapshotId: result.snapshotId,
                    employees: employees.slice(0, 3),
                });
            }
        } catch (backendErr) {
            console.warn('Backend proxy failed, returning raw extracted data:', backendErr);
        }

        return NextResponse.json({
            status: 'success',
            count: employees.length,
            employees: employees.slice(0, 3),
            note: 'Processed by AI. Connect backend for full persistence.',
        });

    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 });
    }
}

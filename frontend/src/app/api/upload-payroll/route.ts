import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as XLSX from 'xlsx';
// @ts-ignore
import pdf from 'pdf-parse-fork';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const AI_SYSTEM_PROMPT = `You are an elite payroll data extraction engine. 
You will receive raw text from a payroll document.
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
        const fileName = file.name.toLowerCase();
        
        let textContent = '';

        if (fileName.endsWith('.pdf')) {
            try {
                // pdf-parse-fork handles Node environment correctly
                const data = await pdf(buffer);
                textContent = data.text;
            } catch (err: any) {
                console.error('PDF Parse error:', err);
                return NextResponse.json({ error: `Could not read PDF: ${err.message}` }, { status: 422 });
            }
        } 
        else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
            try {
                const workbook = XLSX.read(buffer, { type: 'buffer' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                textContent = XLSX.utils.sheet_to_csv(worksheet);
            } catch (err: any) {
                console.error('Excel Parse error:', err);
                return NextResponse.json({ error: `Could not read spreadsheet: ${err.message}` }, { status: 422 });
            }
        } else {
            return NextResponse.json({ error: 'Unsupported file type. Please upload PDF, XLSX, or CSV.' }, { status: 400 });
        }

        if (!textContent || textContent.trim().length < 5) {
            return NextResponse.json({ error: 'File appears to be empty or unreadable.' }, { status: 422 });
        }

        // --- Call OpenAI ---
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: AI_SYSTEM_PROMPT },
                { role: 'user', content: textContent.substring(0, 60000) }
            ],
            temperature: 0,
        });

        const resultText = response.choices[0].message.content;
        if (!resultText) throw new Error('OpenAI returned empty response');

        const jsonResult = JSON.parse(resultText);
        const employees: any[] = jsonResult.employees || [];

        if (employees.length === 0) {
            return NextResponse.json({ error: 'AI could not find employees in this file.' }, { status: 422 });
        }

        // --- Persist to Backend ---
        const backendUrl = 'https://projeto-lola-mxos.vercel.app';
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
                body: JSON.stringify(payload)
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
            console.warn('Backend unavailable, returning extracted data only.');
        }

        return NextResponse.json({
            status: 'success',
            count: employees.length,
            employees: employees.slice(0, 3)
        });

    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 });
    }
}

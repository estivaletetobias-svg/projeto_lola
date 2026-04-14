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

const AI_SYSTEM_PROMPT = `You are an elite payroll and HR data extraction engine.
You will receive raw text from a Brazilian HR spreadsheet (Estrutura de Cargos / Folha de Pagamento).

CRITICAL STRUCTURAL RULES for NODETech-style spreadsheets:
- The spreadsheet uses EMPLOYEE CODES (numeric IDs like 15, 50, 104) as identifiers — NOT employee names.
- There is a column for the MANAGER NAME ("Este cargo reporta para: NOME do Gestor") — this is the BOSS, NOT the employee.
- Do NOT use the manager's name as the employee's full_name. That field belongs to the supervisor.
- Since there is no employee name column, set full_name to: "Cód. [employee_code]" (e.g., "Cód. 15").
- The employee_key should be the employee numeric code as a string (e.g., "15", "104").
- Extract the manager_name as a separate field when available.

Extract ALL employee rows. Ignore headers, empty rows, totals, and decorative/example lines.
Ensure salary numbers are floats (e.g., 5000.00 not "5.000,00").
Return a strictly valid JSON object with a single root key 'employees' containing an array.
Each object MUST match exactly:
{
  employee_key: string,    // Employee numeric code as string (e.g., "15", "104")
  full_name: string,       // "Cód. [code]" when no name column exists (e.g., "Cód. 15")
  area: string,            // Cargo Atual (job title) + Senioridade if available (e.g., "Engenheiro de Software Full Stack - Sênior")
  department: string,      // Área ou Departamento (e.g., "DEV", "Administrativo")
  seniority: string,       // Senioridade (e.g., "Júnior", "Pleno", "Sênior")
  manager_name: string,    // Nome do Gestor (the supervisor's name, NOT the employee)
  base_salary: number,     // Salário base as float
  benefits: number,        // sum of benefits or 0
  variable: number,        // sum of variable pay or 0
  monthly_hours: number,   // Carga Horária Mensal (e.g., 160, 220)
  gender: string,          // Gênero (masculino/feminino)
  contract_type: string    // Tipo de Contratação (e.g., "CLT", "PJ")
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

        // --- Persist Directly to DB (Native Next.js Integration) ---
        const { prisma } = await import('@/lib/prisma');
        
        try {
            // Find tenant or use a default
            const tenant = await prisma.tenant.findFirst() || await prisma.tenant.create({ data: { name: 'Lola Tech Ltd' } });
            
            // Create Snapshot
            const snapshot = await prisma.payrollSnapshot.create({
                data: {
                    tenant_id: tenant.id,
                    period_date: new Date(),
                    source_type: file.name.split('.').pop()?.toUpperCase() || 'LOCAL',
                    s3_file_key: `local/${file.name}`,
                    status: 'READY',
                }
            });

            // Upsert Employees and create Compensation
            for (const e of employees) {
                const employeeKey = String(e.id || e.employee_key);
                const emp = await prisma.employee.upsert({
                    where: { 
                        tenant_id_employee_key: { 
                            tenant_id: tenant.id, 
                            employee_key: employeeKey
                        } 
                    },
                    update: {
                        full_name: e.full_name || `Cód. ${employeeKey}`,
                        area: e.area,
                        department: e.department || null,
                        seniority: e.seniority || null,
                        manager_name: e.manager_name || null,
                        gender: e.gender || null,
                        contract_type: e.contract_type || null,
                        monthly_hours: e.monthly_hours ? Number(e.monthly_hours) : null,
                        status: 'ACTIVE',
                    },
                    create: {
                        tenant_id: tenant.id,
                        employee_key: employeeKey,
                        full_name: e.full_name || `Cód. ${employeeKey}`,
                        area: e.area,
                        department: e.department || null,
                        seniority: e.seniority || null,
                        manager_name: e.manager_name || null,
                        gender: e.gender || null,
                        contract_type: e.contract_type || null,
                        monthly_hours: e.monthly_hours ? Number(e.monthly_hours) : null,
                        status: 'ACTIVE',
                    }
                });


                await prisma.compensation.create({
                    data: {
                        employee_id: emp.id,
                        snapshot_id: snapshot.id,
                        base_salary: Number(e.base_salary) || 0,
                        benefits_value: Number(e.benefits) || 0,
                        variable_value: Number(e.variable) || 0,
                        total_cash: (Number(e.base_salary) || 0) + (Number(e.benefits) || 0) + (Number(e.variable) || 0),
                    }
                });
            }

            return NextResponse.json({
                status: 'success',
                count: employees.length,
                snapshotId: snapshot.id,
                employees: employees,
            });
        } catch (dbErr: any) {
            console.error('Database persistence failed:', dbErr);
            return NextResponse.json({
                status: 'success',
                count: employees.length,
                dbStatus: 'persistence_failed',
                employees: employees,
            });
        }

    } catch (error: any) {
        console.error('Upload API error:', error);
        return NextResponse.json({ error: error.message || 'Processing failed' }, { status: 500 });
    }
}

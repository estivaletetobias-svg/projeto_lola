import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';
import OpenAI from 'openai';
const pdfParse = require('pdf-parse');

@Processor('payroll-analysis')
export class ImportValidationProcessor extends WorkerHost {
    private readonly logger = new Logger(ImportValidationProcessor.name);

    constructor(
        private prisma: PrismaService,
        private storage: StorageService,
    ) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        const { snapshotId, jobId, tenantId } = job.data;

        this.logger.log(`Processing payroll analysis for snapshot: ${snapshotId}`);

        try {
            await this.prisma.payrollImportJob.update({
                where: { id: jobId },
                data: { status: 'PROCESSING', started_at: new Date() },
            });

            const snapshot = await this.prisma.payrollSnapshot.findUnique({
                where: { id: snapshotId },
            });

            if (!snapshot) {
                throw new Error(`Snapshot ${snapshotId} not found`);
            }

            const key = snapshot.s3_file_key;
            const fileBody = await this.storage.getFile(key);
            const buffer = await this.streamToBuffer(fileBody);

            let textContent = '';

            if (snapshot.source_type === 'XLSX' || key.toLowerCase().endsWith('.xlsx')) {
                this.logger.log(`Parsing XLSX to text...`);
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer as any);
                const worksheet = workbook.getWorksheet(1);
                const rows: any[] = [];
                if (worksheet) {
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        rows.push(row.values);
                    });
                }
                textContent = JSON.stringify(rows).substring(0, 50000); // Prevent token overflow for huge files
            } else if (snapshot.source_type === 'PDF' || snapshot.source_type === 'pdf' || key.toLowerCase().endsWith('.pdf')) {
                this.logger.log(`Parsing PDF to text...`);
                const pdfData = await pdfParse(buffer);
                textContent = pdfData.text;
            } else {
                this.logger.log(`Assuming CSV/TXT format...`);
                textContent = buffer.toString().substring(0, 50000);
            }

            this.logger.log(`Extracting data via OpenAI API for zero-touch parsing...`);
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: "system",
                        content: `You are an elite payroll data extraction engine. You will be given raw text extracted from a payroll slip, CSV, or spreadsheet.
                        Extract ALL employee rows. Ignore completely empty lines or purely decorative headers. Ensure numbers are properly formatted as floats (e.g., 5000.00 not 5.000,00).
                        Return a strictly valid JSON object with a single root key 'employees', containing an array of objects.
                        Each object MUST matching this TS interface exactly:
                        {
                            employee_key: string; // Document, ID, CPF, or generate a unique string if none exists
                            full_name: string; // The full name of the employee
                            area: string; // Their role, job title, department, or 'Geral'
                            base_salary: number; // Base salary value
                            benefits: number; // Sum of benefits or 0
                            variable: number; // Sum of variable pay or 0
                        }`
                    },
                    {
                        role: "user",
                        content: textContent
                    }
                ]
            });

            const resultText = response.choices[0].message.content;
            if (!resultText) throw new Error("OpenAI returned empty response");
            
            const jsonResult = JSON.parse(resultText);
            const data = jsonResult.employees || [];
            
            this.logger.log(`OpenAI extracted ${data.length} records dynamically.`);

            // 1. Validate and Persist
            const errors: Record<string, any>[] = []; // Changed type to Record<string, any>[]
            for (const row of data) {
                try {
                    // Find or create employee
                    let employee = await this.prisma.employee.findUnique({
                        where: { tenant_id_employee_key: { tenant_id: tenantId, employee_key: String(row.employee_key) } }
                    });

                    if (!employee) {
                        employee = await this.prisma.employee.create({
                            data: {
                                tenant_id: tenantId,
                                employee_key: String(row.employee_key),
                                full_name: row.full_name,
                                area: row.area,
                            }
                        });
                    }

                    // Create Compensation
                    const totalCash = parseFloat(row.base_salary) + parseFloat(row.benefits || 0) + parseFloat(row.variable || 0);

                    await this.prisma.compensation.create({
                        data: {
                            employee_id: employee.id,
                            snapshot_id: snapshotId,
                            base_salary: parseFloat(row.base_salary),
                            benefits_value: parseFloat(row.benefits || 0),
                            variable_value: parseFloat(row.variable || 0),
                            total_cash: totalCash,
                        }
                    });
                } catch (e) {
                    errors.push({ row, error: e.message });
                }
            }

            await this.prisma.payrollImportJob.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    finished_at: new Date(),
                    error_log: errors.length > 0 ? JSON.stringify({ errors }) : ''
                },
            });

            await this.prisma.payrollSnapshot.update({
                where: { id: snapshotId },
                data: { status: 'MAPPING' },
            });

            this.logger.log(`Snapshot ${snapshotId} ready for mapping.`);

        } catch (error) {
            this.logger.error(`Error processing job: ${error.message}`);
            await this.prisma.payrollImportJob.update({
                where: { id: jobId },
                data: { status: 'FAILED', error_log: JSON.stringify({ error: error.message }) },
            });
            await this.prisma.payrollSnapshot.update({
                where: { id: snapshotId },
                data: { status: 'ERROR' },
            });
        }
    }

    private async streamToBuffer(stream: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on('data', (chunk: any) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';

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

            const key = snapshot.s3_file_key;
            const fileBody = await this.storage.getFile(key);
            const buffer = await this.streamToBuffer(fileBody);

            let data: any[] = [];
            if (snapshot.source_type === 'XLSX') {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.getWorksheet(1);
                const rows = [];
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber === 1) return; // Header
                    rows.push(row.values);
                });
                // Simplistic mapping for MVP
                data = rows.map(r => ({
                    employee_key: r[1],
                    full_name: r[2],
                    area: r[3],
                    base_salary: parseFloat(r[4] || 0),
                    benefits: parseFloat(r[5] || 0),
                    variable: parseFloat(r[6] || 0),
                }));
            } else {
                const records = parse(buffer.toString(), {
                    columns: true,
                    skip_empty_lines: true,
                });
                data = records;
            }

            // 1. Validate and Persist
            const errors = [];
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
                    error_log: errors.length > 0 ? { errors } : null
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
                data: { status: 'FAILED', error_log: { error: error.message } },
            });
            await this.prisma.payrollSnapshot.update({
                where: { id: snapshotId },
                data: { status: 'ERROR' },
            });
        }
    }

    private async streamToBuffer(stream: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}

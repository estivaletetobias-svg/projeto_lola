import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ImportValidationProcessor } from '../import-validation/import-validation.processor';
import { Optional } from '@nestjs/common';

@Injectable()
export class PayrollService {
    constructor(
        private prisma: PrismaService,
        private storage: StorageService,
        private processor: ImportValidationProcessor,
        @Optional() @InjectQueue('payroll-analysis') private analysisQueue: Queue,
    ) { }

    async createSnapshot(tenantId: string, dto: CreatePayrollSnapshotDto) {
        const key = `tenants/${tenantId}/snapshots/${Date.now()}-${dto.sourceType.toLowerCase()}`;

        const snapshot = await this.prisma.payrollSnapshot.create({
            data: {
                tenant_id: tenantId,
                period_date: new Date(dto.periodDate),
                source_type: dto.sourceType,
                s3_file_key: key,
                status: 'PENDING',
            },
        });

        const uploadUrl = await this.storage.getPresignedUrl(key);

        return {
            snapshot,
            uploadUrl,
        };
    }

    async listSnapshots(tenantId: string) {
        return this.prisma.payrollSnapshot.findMany({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
        });
    }

    async getSnapshotStatus(tenantId: string, id: string) {
        const snapshot = await this.prisma.payrollSnapshot.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                import_jobs: true,
            },
        });

        if (!snapshot) throw new NotFoundException('Snapshot not found');
        return snapshot;
    }

    async triggerAnalysis(tenantId: string, id: string) {
        const snapshot = await this.prisma.payrollSnapshot.findUnique({
            where: { id },
        });

        if (!snapshot || snapshot.tenant_id !== tenantId) {
            throw new NotFoundException('Snapshot not found');
        }

        // Update status to VALIDATING
        await this.prisma.payrollSnapshot.update({
            where: { id },
            data: { status: 'VALIDATING' },
        });

        // Create a job record
        const job = await this.prisma.payrollImportJob.create({
            data: {
                snapshot_id: id,
                status: 'PENDING',
            },
        });

        // Try to add to BullMQ if available
        if (this.analysisQueue) {
            try {
                await this.analysisQueue.add('analyze', {
                    snapshotId: id,
                    jobId: job.id,
                    tenantId,
                });
                return { message: 'Analysis started (Async)', jobId: job.id };
            } catch (e) {
                console.warn('BullMQ failed, falling back to sync processing');
            }
        }

        // Fallback: Sync processing
        this.processor.process({
            data: {
                snapshotId: id,
                jobId: job.id,
                tenantId,
            }
        } as any);

        return { message: 'Analysis processed (Sync)', jobId: job.id };
    }

    async createAndProcessLocal(tenantId: string, body: { fileName: string, periodDate: string, data: any[] }) {
        console.time('PayrollSync');

        // 1. Create Snapshot
        const snapshot = await this.prisma.payrollSnapshot.create({
            data: {
                tenant_id: tenantId,
                period_date: new Date(body.periodDate),
                source_type: 'LOCAL',
                s3_file_key: `local/${body.fileName}`,
                status: 'READY',
            },
        });

        // 2. Fetch all existing employees to avoid repetitive lookups
        const existingEmployees = await this.prisma.employee.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, employee_key: true }
        });

        const employeeMap = new Map(existingEmployees.map(e => [e.employee_key, e.id]));
        const compensationData = [];
        const newEmployees = [];

        for (const row of body.data) {
            const key = String(row.id || row.key || row.matricula || row.Matrícula || row.Code || 'MISSING');
            let empId = employeeMap.get(key);

            if (!empId) {
                // If it's a new employee, we create them on the fly for simplicity in this MVP sync version
                // but let's try to batch it if possible. 
                // For "Manda Ver" speed, we'll keep it simple but slightly better.
                const newEmp = await this.prisma.employee.create({
                    data: {
                        tenant_id: tenantId,
                        employee_key: key,
                        full_name: row.nome || row.name || row['Nome Completo'] || row.Nome || 'N/A',
                        area: row.area || row.departamento || row['Área/Unidade'] || row.Area || 'Geral',
                    }
                });
                empId = newEmp.id;
                employeeMap.set(key, empId);
            }

            const salary = parseFloat(row.salario || row.base_salary || row['Salário Base'] || row.Salario || row.Remuneração || 0);

            compensationData.push({
                employee_id: empId,
                snapshot_id: snapshot.id,
                base_salary: salary,
                benefits_value: 0,
                variable_value: 0,
                total_cash: salary,
            });
        }

        // Batch create compensations
        if (compensationData.length > 0) {
            await this.prisma.compensation.createMany({ data: compensationData });
        }

        console.timeEnd('PayrollSync');
        return { status: 'success', snapshotId: snapshot.id, count: body.data.length };
    }
}

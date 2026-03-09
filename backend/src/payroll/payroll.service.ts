import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SnapshotStatus } from '@prisma/client';
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

        // 2. Direct Persist (Bypassing background jobs for "Manda ver" speed)
        for (const row of body.data) {
            let employee = await this.prisma.employee.findUnique({
                where: { tenant_id_employee_key: { tenant_id: tenantId, employee_key: String(row.id || row.key || row.matricula) } }
            });

            if (!employee) {
                employee = await this.prisma.employee.create({
                    data: {
                        tenant_id: tenantId,
                        employee_key: String(row.id || row.key || row.matricula),
                        full_name: row.nome || row.name,
                        area: row.area || row.departamento || 'Geral',
                    }
                });
            }

            await this.prisma.compensation.create({
                data: {
                    employee_id: employee.id,
                    snapshot_id: snapshot.id,
                    base_salary: parseFloat(row.salario || row.base_salary || 0),
                    total_cash: parseFloat(row.salario || row.base_salary || 0),
                }
            });
        }

        return { status: 'success', snapshotId: snapshot.id, count: body.data.length };
    }
}

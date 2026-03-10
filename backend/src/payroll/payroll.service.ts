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

        // Fetch Job Catalog for auto-matching
        const jobCatalog = await this.prisma.jobCatalog.findMany();

        for (let i = 0; i < body.data.length; i++) {
            const row = body.data[i];

            // Força a criação de um ID ÚNICO por linha para evitar que o sistema "esmague" os 61 colaboradores em 1
            // Usamos um prefixo com o ID do snapshot para ser único globalmente
            const uniqueKey = `snap-${snapshot.id}-row-${i}`;

            const rowKeys = Object.keys(row);
            const findCol = (terms: string[]) => rowKeys.find(k => {
                const cleanK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return terms.some(t => {
                    const cleanT = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return cleanK.includes(cleanT) || cleanT.includes(cleanK);
                });
            });

            const getVal = (terms: string[]) => {
                const col = findCol(terms);
                return col ? row[col] : null;
            };

            const rawName = row.nome || row.name || getVal(['nome', 'colaborador', 'funcionário', 'funcionario', 'name', 'pessoal']) || `Colaborador ${i + 1}`;
            const rawArea = row.area || row.departamento || getVal(['área', 'area', 'unidade', 'depto', 'função', 'funcao', 'cargo', 'title', 'job', 'ocupação', 'ocupacao', 'descrição', 'func', 'cargho', 'setor', 'posição', 'posicao', 'vencimento']) || 'Geral';

            // Parsing robusto para valores brasileiros (ex: 5.000,00 ou 5000.00)
            let rawSalary = row.salario || getVal(['salário', 'salario', 'remunera', 'base', 'total', 'proventos', 'vencimento', 'bruto', 'rendimento']) || 0;
            let salaryStr = String(rawSalary).trim();

            // Se tem vírgula e ponto, o ponto costuma ser milhar e vírgula decimal
            if (salaryStr.includes(',') && salaryStr.includes('.')) {
                salaryStr = salaryStr.replace(/\./g, '').replace(',', '.');
            } else if (salaryStr.includes(',')) {
                // Se só tem vírgula, trocamos por ponto
                salaryStr = salaryStr.replace(',', '.');
            }

            const salary = parseFloat(salaryStr.replace(/[^\d.]/g, '')) || 0;

            const newEmp = await this.prisma.employee.create({
                data: {
                    tenant_id: tenantId,
                    employee_key: uniqueKey,
                    full_name: String(rawName),
                    area: String(rawArea),
                }
            });

            compensationData.push({
                employee_id: newEmp.id,
                snapshot_id: snapshot.id,
                base_salary: salary,
                benefits_value: 0,
                variable_value: 0,
                total_cash: salary,
            });

            // Auto-matching opcional (se o nome da coluna de cargo for claro)
            const title = String(rawArea).toLowerCase();
            const matchedJob = jobCatalog.find(j =>
                title.includes(j.title_std.toLowerCase())
            );

            if (matchedJob) {
                await this.prisma.jobMatch.create({
                    data: {
                        employee_id: newEmp.id,
                        snapshot_id: snapshot.id,
                        job_catalog_id: matchedJob.id,
                        confidence: 0.9,
                        method: 'AUTO_IMPORT'
                    }
                });
            }
        }

        // Batch create compensations
        if (compensationData.length > 0) {
            await this.prisma.compensation.createMany({ data: compensationData });
        }


        console.timeEnd('PayrollSync');
        return { status: 'success', snapshotId: snapshot.id, count: body.data.length };
    }
}

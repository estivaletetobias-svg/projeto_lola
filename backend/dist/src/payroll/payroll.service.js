"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const import_validation_processor_1 = require("../import-validation/import-validation.processor");
const common_2 = require("@nestjs/common");
let PayrollService = class PayrollService {
    prisma;
    storage;
    processor;
    analysisQueue;
    constructor(prisma, storage, processor, analysisQueue) {
        this.prisma = prisma;
        this.storage = storage;
        this.processor = processor;
        this.analysisQueue = analysisQueue;
    }
    async createSnapshot(tenantId, dto) {
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
    async listSnapshots(tenantId) {
        return this.prisma.payrollSnapshot.findMany({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
        });
    }
    async getSnapshotStatus(tenantId, id) {
        const snapshot = await this.prisma.payrollSnapshot.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                import_jobs: true,
            },
        });
        if (!snapshot)
            throw new common_1.NotFoundException('Snapshot not found');
        return snapshot;
    }
    async triggerAnalysis(tenantId, id) {
        const snapshot = await this.prisma.payrollSnapshot.findUnique({
            where: { id },
        });
        if (!snapshot || snapshot.tenant_id !== tenantId) {
            throw new common_1.NotFoundException('Snapshot not found');
        }
        await this.prisma.payrollSnapshot.update({
            where: { id },
            data: { status: 'VALIDATING' },
        });
        const job = await this.prisma.payrollImportJob.create({
            data: {
                snapshot_id: id,
                status: 'PENDING',
            },
        });
        if (this.analysisQueue) {
            try {
                await this.analysisQueue.add('analyze', {
                    snapshotId: id,
                    jobId: job.id,
                    tenantId,
                });
                return { message: 'Analysis started (Async)', jobId: job.id };
            }
            catch (e) {
                console.warn('BullMQ failed, falling back to sync processing');
            }
        }
        this.processor.process({
            data: {
                snapshotId: id,
                jobId: job.id,
                tenantId,
            }
        });
        return { message: 'Analysis processed (Sync)', jobId: job.id };
    }
    async createAndProcessLocal(tenantId, body) {
        console.time('PayrollSync');
        const snapshot = await this.prisma.payrollSnapshot.create({
            data: {
                tenant_id: tenantId,
                period_date: new Date(body.periodDate),
                source_type: 'LOCAL',
                s3_file_key: `local/${body.fileName}`,
                status: 'READY',
            },
        });
        const existingEmployees = await this.prisma.employee.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, employee_key: true }
        });
        const employeeMap = new Map(existingEmployees.map(e => [e.employee_key, e.id]));
        const compensationData = [];
        const newEmployees = [];
        const jobCatalog = await this.prisma.jobCatalog.findMany();
        for (let i = 0; i < body.data.length; i++) {
            const row = body.data[i];
            const uniqueKey = `snap-${snapshot.id}-row-${i}`;
            const rowKeys = Object.keys(row);
            const findCol = (terms) => rowKeys.find(k => {
                const cleanK = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return terms.some(t => {
                    const cleanT = t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return cleanK.includes(cleanT) || cleanT.includes(cleanK);
                });
            });
            const getVal = (terms) => {
                const col = findCol(terms);
                return col ? row[col] : null;
            };
            const rawName = row.nome || row.name || getVal(['nome', 'colaborador', 'funcionário', 'funcionario', 'name', 'pessoal']) || `Colaborador ${i + 1}`;
            const rawArea = row.area || row.departamento || getVal(['área', 'area', 'unidade', 'depto', 'função', 'funcao', 'cargo', 'title', 'job', 'ocupação', 'ocupacao', 'descrição', 'func', 'cargho', 'setor', 'posição', 'posicao', 'vencimento']) || 'Geral';
            let rawSalary = row.salario || getVal(['salário', 'salario', 'remunera', 'base', 'total', 'proventos', 'vencimento', 'bruto', 'rendimento']) || 0;
            let salaryStr = String(rawSalary).trim();
            if (salaryStr.includes(',') && salaryStr.includes('.')) {
                salaryStr = salaryStr.replace(/\./g, '').replace(',', '.');
            }
            else if (salaryStr.includes(',')) {
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
            const title = String(rawArea).toLowerCase();
            const matchedJob = jobCatalog.find(j => title.includes(j.title_std.toLowerCase()));
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
        if (compensationData.length > 0) {
            await this.prisma.compensation.createMany({ data: compensationData });
        }
        console.timeEnd('PayrollSync');
        return { status: 'success', snapshotId: snapshot.id, count: body.data.length };
    }
};
exports.PayrollService = PayrollService;
exports.PayrollService = PayrollService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_2.Optional)()),
    __param(3, (0, bullmq_1.InjectQueue)('payroll-analysis')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        import_validation_processor_1.ImportValidationProcessor,
        bullmq_2.Queue])
], PayrollService);
//# sourceMappingURL=payroll.service.js.map
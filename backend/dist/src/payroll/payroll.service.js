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
        const snapshot = await this.prisma.payrollSnapshot.create({
            data: {
                tenant_id: tenantId,
                period_date: new Date(body.periodDate),
                source_type: 'LOCAL',
                s3_file_key: `local/${body.fileName}`,
                status: 'READY',
            },
        });
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
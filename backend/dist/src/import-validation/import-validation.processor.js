"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ImportValidationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportValidationProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const sync_1 = require("csv-parse/sync");
const ExcelJS = __importStar(require("exceljs"));
let ImportValidationProcessor = ImportValidationProcessor_1 = class ImportValidationProcessor extends bullmq_1.WorkerHost {
    prisma;
    storage;
    logger = new common_1.Logger(ImportValidationProcessor_1.name);
    constructor(prisma, storage) {
        super();
        this.prisma = prisma;
        this.storage = storage;
    }
    async process(job) {
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
            let data = [];
            if (snapshot.source_type === 'XLSX') {
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.getWorksheet(1);
                const rows = [];
                if (worksheet) {
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        if (rowNumber === 1)
                            return;
                        rows.push(row.values);
                    });
                }
                data = rows.map(r => ({
                    employee_key: r[1],
                    full_name: r[2],
                    area: r[3],
                    base_salary: parseFloat(r[4] || 0),
                    benefits: parseFloat(r[5] || 0),
                    variable: parseFloat(r[6] || 0),
                }));
            }
            else {
                const records = (0, sync_1.parse)(buffer.toString(), {
                    columns: true,
                    skip_empty_lines: true,
                });
                data = records;
            }
            const errors = [];
            for (const row of data) {
                try {
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
                }
                catch (e) {
                    errors.push({ row, error: e.message });
                }
            }
            await this.prisma.payrollImportJob.update({
                where: { id: jobId },
                data: {
                    status: 'COMPLETED',
                    finished_at: new Date(),
                    error_log: errors.length > 0 ? { errors } : {}
                },
            });
            await this.prisma.payrollSnapshot.update({
                where: { id: snapshotId },
                data: { status: 'MAPPING' },
            });
            this.logger.log(`Snapshot ${snapshotId} ready for mapping.`);
        }
        catch (error) {
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
    async streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
};
exports.ImportValidationProcessor = ImportValidationProcessor;
exports.ImportValidationProcessor = ImportValidationProcessor = ImportValidationProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('payroll-analysis'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], ImportValidationProcessor);
//# sourceMappingURL=import-validation.processor.js.map
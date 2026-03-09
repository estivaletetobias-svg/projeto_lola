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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobMatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let JobMatchService = class JobMatchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMatchesForSnapshot(snapshotId) {
        const employees = await this.prisma.employee.findMany({
            where: {
                compensation: {
                    some: { snapshot_id: snapshotId }
                }
            },
            include: {
                job_matches: {
                    where: { snapshot_id: snapshotId },
                    include: { job_catalog: true }
                }
            }
        });
        return employees.map(emp => ({
            employeeId: emp.id,
            employeeName: emp.full_name,
            internalTitle: emp.area,
            match: emp.job_matches[0] || null
        }));
    }
    async upsertMatch(data) {
        const { employeeId, snapshotId, jobCatalogId, method } = data;
        const existing = await this.prisma.jobMatch.findFirst({
            where: { employee_id: employeeId, snapshot_id: snapshotId }
        });
        if (existing) {
            return this.prisma.jobMatch.update({
                where: { id: existing.id },
                data: { job_catalog_id: jobCatalogId, method: method || 'MANUAL' }
            });
        }
        else {
            return this.prisma.jobMatch.create({
                data: {
                    employee_id: employeeId,
                    snapshot_id: snapshotId,
                    job_catalog_id: jobCatalogId,
                    confidence: 1.0,
                    method: method || 'MANUAL'
                }
            });
        }
    }
    async autoMatch(snapshotId) {
        return 0;
    }
};
exports.JobMatchService = JobMatchService;
exports.JobMatchService = JobMatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobMatchService);
//# sourceMappingURL=job-match.service.js.map
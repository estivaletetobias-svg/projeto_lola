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
    async autoMatch(snapshotId) {
        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: { employee: true },
        });
        const catalog = await this.prisma.jobCatalog.findMany();
        const matches = [];
        for (const comp of compensations) {
            const employeeTitle = comp.employee.area;
            const bestMatch = catalog.find(cat => employeeTitle.toLowerCase().includes(cat.title_std.toLowerCase()) ||
                cat.title_std.toLowerCase().includes(employeeTitle.toLowerCase()));
            if (bestMatch) {
                matches.push({
                    employee_id: comp.employee_id,
                    snapshot_id: snapshotId,
                    job_catalog_id: bestMatch.id,
                    confidence: 0.8,
                    method: 'REGEX',
                });
            }
        }
        if (matches.length > 0) {
            await this.prisma.jobMatch.createMany({
                data: matches,
            });
        }
        return matches.length;
    }
};
exports.JobMatchService = JobMatchService;
exports.JobMatchService = JobMatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobMatchService);
//# sourceMappingURL=job-match.service.js.map
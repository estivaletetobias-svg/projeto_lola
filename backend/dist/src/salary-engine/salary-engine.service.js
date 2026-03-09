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
var SalaryEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SalaryEngineService = SalaryEngineService_1 = class SalaryEngineService {
    prisma;
    logger = new common_1.Logger(SalaryEngineService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateRegression(data) {
        const n = data.length;
        if (n < 2)
            return { slope: 0, intercept: 0, rSquared: 0 };
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (const point of data) {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
            sumY2 += point.y * point.y;
        }
        const denominator = (n * sumX2 - sumX * sumX);
        if (denominator === 0)
            return { slope: 0, intercept: 0, rSquared: 0 };
        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;
        const num = (n * sumXY - sumX * sumY) ** 2;
        const den = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
        const rSquared = den === 0 ? 0 : num / den;
        return { slope, intercept, rSquared };
    }
    async getAnalysisPoints(snapshotId) {
        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: {
                employee: {
                    include: {
                        job_matches: {
                            where: { snapshot_id: snapshotId },
                            include: { job_catalog: true }
                        }
                    }
                }
            }
        });
        const levelToGrade = (level) => {
            const l = level.toLowerCase();
            if (l.includes('intern') || l.includes('estagi'))
                return 1;
            if (l.includes('jr') || l.includes('junior'))
                return 2;
            if (l.includes('pl') || l.includes('pleno'))
                return 3;
            if (l.includes('sr') || l.includes('senior'))
                return 4;
            if (l.includes('spec') || l.includes('especialista'))
                return 5;
            if (l.includes('coord'))
                return 6;
            if (l.includes('manager') || l.includes('gerente'))
                return 7;
            if (l.includes('director') || l.includes('diretor'))
                return 8;
            return 3;
        };
        return compensations
            .filter(c => c.employee.job_matches.length > 0)
            .map(c => ({
            x: levelToGrade(c.employee.job_matches[0].job_catalog.level),
            y: c.base_salary,
            name: c.employee.full_name
        }));
    }
    generateTableEntry(midpoint, stepIndex, totalSteps, rangeSpread) {
        const min = midpoint / (1 + rangeSpread / 2);
        const max = min * (1 + rangeSpread);
        const stepValue = min + ((max - min) / (totalSteps - 1)) * stepIndex;
        return Math.round(stepValue * 100) / 100;
    }
};
exports.SalaryEngineService = SalaryEngineService;
exports.SalaryEngineService = SalaryEngineService = SalaryEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalaryEngineService);
//# sourceMappingURL=salary-engine.service.js.map
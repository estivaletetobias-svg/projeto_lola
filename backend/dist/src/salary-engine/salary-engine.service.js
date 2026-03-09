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
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        const num = (n * sumXY - sumX * sumY) ** 2;
        const den = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
        const rSquared = den === 0 ? 0 : num / den;
        return { slope, intercept, rSquared };
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
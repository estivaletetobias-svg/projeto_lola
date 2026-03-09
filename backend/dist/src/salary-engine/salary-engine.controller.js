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
var SalaryEngineController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryEngineController = void 0;
const common_1 = require("@nestjs/common");
const salary_engine_service_1 = require("./salary-engine.service");
let SalaryEngineController = SalaryEngineController_1 = class SalaryEngineController {
    salaryEngine;
    logger = new common_1.Logger(SalaryEngineController_1.name);
    constructor(salaryEngine) {
        this.salaryEngine = salaryEngine;
    }
    async testAnalysis(body) {
        this.logger.log('Receiving request for salary analysis...');
        const { points, stepsCount, rangeSpread } = body;
        return this.processAnalysis(points, stepsCount, rangeSpread);
    }
    async analyzeSnapshot(snapshotId) {
        this.logger.log(`Analyzing snapshot ${snapshotId}...`);
        const points = await this.salaryEngine.getAnalysisPoints(snapshotId);
        if (points.length === 0) {
            return {
                status: 'error',
                message: 'No mapped payroll data found for this snapshot. Run job-match first.'
            };
        }
        return this.processAnalysis(points, 5, 0.4);
    }
    processAnalysis(points, stepsCount, rangeSpread) {
        const regression = this.salaryEngine.calculateRegression(points);
        const distinctGrades = Array.from(new Set(points.map(p => p.x))).sort((a, b) => a - b);
        const suggestedTable = distinctGrades.map(grade => {
            const predictedMidpoint = regression.slope * grade + regression.intercept;
            const steps = [];
            for (let i = 0; i < (stepsCount || 5); i++) {
                steps.push({
                    stepLabel: String.fromCharCode(65 + i),
                    value: this.salaryEngine.generateTableEntry(predictedMidpoint, i, stepsCount || 5, rangeSpread || 0.4)
                });
            }
            return {
                grade: `G${grade}`,
                midpoint: Math.round(predictedMidpoint * 100) / 100,
                steps
            };
        });
        return {
            status: 'success',
            diagnostics: {
                regressionCurve: regression,
                pointsCount: points.length,
                recommendation: regression.rSquared > 0.8
                    ? 'Estrutura Financeira Coesa'
                    : regression.rSquared > 0.5
                        ? 'Alinhamento Moderado'
                        : 'Atenção: Dispersão Crítica Detectada'
            },
            suggestedSalaryStructure: suggestedTable
        };
    }
};
exports.SalaryEngineController = SalaryEngineController;
__decorate([
    (0, common_1.Post)('test-analysis'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SalaryEngineController.prototype, "testAnalysis", null);
__decorate([
    (0, common_1.Get)('analyze/:snapshotId'),
    __param(0, (0, common_1.Param)('snapshotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalaryEngineController.prototype, "analyzeSnapshot", null);
exports.SalaryEngineController = SalaryEngineController = SalaryEngineController_1 = __decorate([
    (0, common_1.Controller)('salary-engine'),
    __metadata("design:paramtypes", [salary_engine_service_1.SalaryEngineService])
], SalaryEngineController);
//# sourceMappingURL=salary-engine.controller.js.map
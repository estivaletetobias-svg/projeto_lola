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
exports.MeritCycleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MeritCycleService = class MeritCycleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSimulation(tenantId, snapshotId, budget, scenarios = ['CONSERVATIVE', 'BALANCED', 'AGRESSIVE']) {
        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: snapshotId, employee: { tenant_id: tenantId } },
            include: {
                employee: {
                    include: {
                        job_matches: {
                            where: { snapshot_id: snapshotId },
                            include: { job_catalog: { include: { market_benchmarks: true } } }
                        }
                    }
                }
            },
        });
        const results = {};
        for (const scenario of scenarios) {
            results[scenario] = this.runScenario(scenario, budget, compensations);
        }
        return results;
    }
    runScenario(scenario, totalBudget, data) {
        let budgetRemaining = totalBudget;
        const recommendations = [];
        const validData = data.filter(d => d.employee.job_matches.length > 0);
        for (const item of validData) {
            const match = item.employee.job_matches[0];
            const benchmarks = match.job_catalog.market_benchmarks[0];
            if (!benchmarks)
                continue;
            let suggestedRaise = 0;
            let actionType = 'MERIT';
            if (scenario === 'CONSERVATIVE') {
                const p25 = benchmarks.p25;
                if (item.total_cash < p25) {
                    suggestedRaise = Math.min(p25 - item.total_cash, budgetRemaining);
                }
            }
            else if (scenario === 'BALANCED') {
                const p50 = benchmarks.p50;
                if (item.total_cash < p50) {
                    suggestedRaise = Math.min((p50 - item.total_cash) * 0.7, budgetRemaining);
                }
            }
            else {
                const p75 = benchmarks.p75;
                if (item.total_cash < p75) {
                    suggestedRaise = Math.min(p75 - item.total_cash, budgetRemaining);
                    actionType = 'ADJUSTMENT';
                }
            }
            const raisePercent = (suggestedRaise / item.total_cash) * 100;
            recommendations.push({
                employee_id: item.employee_id,
                action_type: actionType,
                suggested_raise_value: suggestedRaise,
                suggested_raise_percent: parseFloat(raisePercent.toFixed(2)),
                new_total_cash: item.total_cash + suggestedRaise,
                cost_monthly: suggestedRaise,
                cost_annual: suggestedRaise * 12,
                rationale: { scenario, gap: benchmarks.p50 - item.total_cash },
            });
            budgetRemaining -= suggestedRaise;
            if (budgetRemaining < 0)
                break;
        }
        return {
            recommendations,
            totalCostMonthly: recommendations.reduce((acc, r) => acc + r.cost_monthly, 0),
            budgetUsedPercent: parseFloat(((totalBudget - budgetRemaining) / totalBudget * 100).toFixed(2)),
        };
    }
};
exports.MeritCycleService = MeritCycleService;
exports.MeritCycleService = MeritCycleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeritCycleService);
//# sourceMappingURL=merit-cycle.service.js.map
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeritCycleService {
    constructor(private prisma: PrismaService) { }

    async createSimulation(tenantId: string, snapshotId: string, budget: number, scenarios: string[] = ['CONSERVATIVE', 'BALANCED', 'AGRESSIVE']) {
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

    private runScenario(scenario: string, totalBudget: number, data: any[]) {
        let budgetRemaining = totalBudget;
        const recommendations = [];

        // Filter to folks with a match
        const validData = data.filter(d => d.employee.job_matches.length > 0);

        for (const item of validData) {
            const match = item.employee.job_matches[0];
            const benchmarks = match.job_catalog.market_benchmarks[0];
            if (!benchmarks) continue;

            let suggestedRaise = 0;
            let actionType = 'MERIT';

            if (scenario === 'CONSERVATIVE') {
                const p25 = benchmarks.p25;
                if (item.total_cash < p25) {
                    suggestedRaise = Math.min(p25 - item.total_cash, budgetRemaining);
                }
            } else if (scenario === 'BALANCED') {
                const p50 = benchmarks.p50;
                if (item.total_cash < p50) {
                    suggestedRaise = Math.min((p50 - item.total_cash) * 0.7, budgetRemaining);
                }
            } else { // AGRESSIVE
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
            if (budgetRemaining < 0) break;
        }

        return {
            recommendations,
            totalCostMonthly: recommendations.reduce((acc, r) => acc + r.cost_monthly, 0),
            budgetUsedPercent: parseFloat(((totalBudget - budgetRemaining) / totalBudget * 100).toFixed(2)),
        };
    }
}

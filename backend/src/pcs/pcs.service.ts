import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PcsService {
    private readonly logger = new Logger(PcsService.name);

    // Base values from October 2025 Research (160h)
    private readonly baseMidpoints: Record<number, number> = {
        10: 2316.0,
        11: 2663.87,
        12: 3254.56,
        13: 4038.69,
        14: 4966.88,
        15: 5989.75,
        16: 7057.92,
        17: 8122.01,
        18: 9132.64,
        19: 10228.56,
        20: 11455.99,
        21: 12830.71,
        22: 14370.40
    };

    private readonly steps = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2];
    private readonly stepLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

    constructor(private prisma: PrismaService) {}

    /**
     * Fetches the latest accumulated INPC from Oct 2025 to today
     * For now, this is a placeholder for an API call to IBGE/BC
     */
    async getLatestInpcFactor() {
        // Sample: 4.2% accumulated
        return 4.2;
    }

    /**
     * Generates a Salary Table adjusted by INPC and Hours
     */
    calculateAdjustedTable(inpcAccumulatedPercent: number = 0, targetHours: number = 220) {
        const inpcFactor = 1 + (inpcAccumulatedPercent / 100);
        const hoursFactor = targetHours / 160;

        const table = Object.entries(this.baseMidpoints).map(([grade, baseMidpoint]) => {
            const adjustedMidpoint = baseMidpoint * inpcFactor * hoursFactor;
            
            const gradeSteps = this.steps.map((factor, index) => ({
                step: this.stepLabels[index],
                factor,
                value: Math.round(adjustedMidpoint * factor * 100) / 100
            }));

            return {
                grade: parseInt(grade),
                midpoint: Math.round(adjustedMidpoint * 100) / 100,
                steps: gradeSteps
            };
        });

        return table;
    }

    /**
     * Analyzes individual employee positioning against the adjusted table
     */
    async analyzeSalaryPositioning(snapshotId: string, inpcPercent: number = 0, targetHours: number = 220) {
        const adjustedTable = this.calculateAdjustedTable(inpcPercent, targetHours);
        const tableMap = new Map(adjustedTable.map(t => [t.grade, t]));

        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: {
                employee: {
                    include: {
                        job_matches: {
                            include: { job_catalog: true }
                        }
                    }
                }
            }
        });

        const analysis = compensations.map(c => {
            const jobMatch = c.employee.job_matches[0];
            const grade = jobMatch?.job_catalog?.grade;
            // The table grade is already adjusted to the TARGET hours (default 160)
            const targetTableGrade = tableMap.get(grade);

            if (!grade || !targetTableGrade) {
                return {
                    name: c.employee.full_name,
                    salary: c.base_salary,
                    grade: grade || 'N/A',
                    status: 'NOT_MAPPED',
                    gap: 0
                };
            }

            // Usa a carga horária real extraída da folha de pagamento (campo monthly_hours)
            if (!c.hours) {
                return {
                    name: c.employee.full_name,
                    salary: c.base_salary,
                    grade: grade || 'N/A',
                    status: 'MISSING_HOURS',
                    gap: 0,
                    error: 'Carga horária não encontrada na folha. Verifique a coluna correspondente.'
                };
            }
            const normalizedSalary = (c.base_salary / c.hours) * targetHours;

            const midpoint = targetTableGrade.midpoint;
            const gap = (normalizedSalary / midpoint - 1) * 100;
            
            // Find the closest step based on normalized salary
            let closestStep = targetTableGrade.steps[0];
            let minDiff = Math.abs(normalizedSalary - closestStep.value);

            for (const step of targetTableGrade.steps) {
                const diff = Math.abs(normalizedSalary - step.value);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestStep = step;
                }
            }

            return {
                name: c.employee.full_name,
                jobTitle: jobMatch.job_catalog.title_std,
                salary: c.base_salary,
                actualHours: c.hours,
                normalizedSalary: Math.round(normalizedSalary * 100) / 100,
                grade: grade,
                midpoint: midpoint,
                gap: Math.round(gap * 100) / 100,
                currentStep: closestStep.step,
                status: gap < -10 ? 'BELOW' : (gap > 10 ? 'ABOVE' : 'ALIGNED')
            };
        });

        return {
            snapshotId,
            summary: {
                totalEmployees: analysis.length,
                belowCount: analysis.filter(a => a.status === 'BELOW').length,
                alignedCount: analysis.filter(a => a.status === 'ALIGNED').length,
                aboveCount: analysis.filter(a => a.status === 'ABOVE').length,
                avgGap: Math.round(analysis.reduce((acc, curr) => acc + (curr.gap || 0), 0) / analysis.length * 100) / 100
            },
            details: analysis
        };
    }

    /**
     * Calculates the financial impact of moving everyone to at least the minimum of their grade
     */
    async calculateImpact(snapshotId: string, inpcPercent: number = 0, targetHours: number = 220) {
        const positioning = await this.analyzeSalaryPositioning(snapshotId, inpcPercent, targetHours);
        const adjustedTable = this.calculateAdjustedTable(inpcPercent, targetHours);
        const tableMap = new Map(adjustedTable.map(t => [t.grade, t]));

        let totalIncrease = 0;
        const enquadramentoDetails = positioning.details
            .filter(p => p.status === 'BELOW')
            .map(p => {
                const targetGrade = tableMap.get(p.grade as number);
                if (!targetGrade) return null;

                const minSalary = targetGrade.steps[0].value; // Step A (0.8)
                const increase = minSalary - p.salary;
                totalIncrease += increase;

                return {
                    name: p.name,
                    currentSalary: p.salary,
                    targetMin: minSalary,
                    increase: increase,
                    percentIncrease: Math.round((increase / p.salary) * 10000) / 100
                };
            })
            .filter(Boolean);

        return {
            monthlyImpact: Math.round(totalIncrease * 100) / 100,
            annualImpact: Math.round(totalIncrease * 13.33 * 100) / 100, // Includes 13th and approx vacation
            affectedCount: enquadramentoDetails.length,
            details: enquadramentoDetails
        };
    }
}

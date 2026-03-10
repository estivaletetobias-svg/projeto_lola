import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalaryEngineService {
    private readonly logger = new Logger(SalaryEngineService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Passo 3: Cálculo Tabela
     * Realiza a regressão linear simples entre Grades e Salários
     * return { slope, intercept, rSquared }
     */
    calculateRegression(data: { x: number; y: number }[]) {
        const n = data.length;
        if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };

        let sumX = 0, sumY = 0;
        for (const point of data) {
            sumX += point.x;
            sumY += point.y;
        }

        if (n === 1) return { slope: 0, intercept: sumY / n, rSquared: 1 };

        let sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (const point of data) {
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
            sumY2 += point.y * point.y;
        }

        const denominator = (n * sumX2 - sumX * sumX);

        // Se todas as grades são iguais, o denominador é zero.
        // Nesse caso, o melhor "fit" é a média simples dos salários naquele ponto.
        if (denominator === 0) {
            return { slope: 0, intercept: sumY / n, rSquared: 0 };
        }

        const slope = (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        // Cálculo do R²
        const num = (n * sumXY - sumX * sumY) ** 2;
        const den = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
        const rSquared = den === 0 ? 0 : num / den;

        return { slope, intercept, rSquared };
    }

    /**
     * Coleta pontos (Grade, Salário) de um Snapshot para análise
     */
    async getAnalysisPoints(snapshotId: string) {
        // Busca compensações e tenta mapear para grades baseadas no campo GRADE do JobCatalog
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

        // Agora usamos o campo .grade real do banco de dados que configuramos no catálogo
        return compensations
            .filter(c => c.employee.job_matches.length > 0)
            .map(c => ({
                x: c.employee.job_matches[0].job_catalog.grade || 0,
                y: c.base_salary,
                name: c.employee.full_name,
                title: c.employee.job_matches[0].job_catalog.title_std,
                salary: c.base_salary
            }));
    }

    /**
     * Passo 4: Estrutura Salarial
     * Gera uma sugestão de tabela baseada no midpoint e range spread
     */
    generateTableEntry(midpoint: number, stepIndex: number, totalSteps: number, rangeSpread: number) {
        // Exemplo: Se rangeSpread é 40% (0.4), o mínimo é midpoint / (1 + rangeSpread/2)
        const min = midpoint / (1 + rangeSpread / 2);
        const max = min * (1 + rangeSpread);

        // Distribuição linear entre min e max para os steps
        const stepValue = min + ((max - min) / (totalSteps - 1)) * stepIndex;
        return Math.round(stepValue * 100) / 100;
    }
}


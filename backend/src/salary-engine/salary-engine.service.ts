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
        if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        for (const point of data) {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumX2 += point.x * point.x;
            sumY2 += point.y * point.y;
        }

        const denominator = (n * sumX2 - sumX * sumX);
        if (denominator === 0) return { slope: 0, intercept: 0, rSquared: 0 };

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
        // Busca compensações e tenta mapear para grades baseadas no nível do cargo (JobMatch)
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

        // Mapeamento básico de Nível para número (Grade)
        // Em um sistema real, isso viria de uma tabela de configuração de grades
        const levelToGrade = (level: string): number => {
            const l = level.toLowerCase();
            if (l.includes('intern') || l.includes('estagi')) return 1;
            if (l.includes('jr') || l.includes('junior')) return 2;
            if (l.includes('pl') || l.includes('pleno')) return 3;
            if (l.includes('sr') || l.includes('senior')) return 4;
            if (l.includes('spec') || l.includes('especialista')) return 5;
            if (l.includes('coord')) return 6;
            if (l.includes('manager') || l.includes('gerente')) return 7;
            if (l.includes('director') || l.includes('diretor')) return 8;
            return 3; // Default pleno
        };

        return compensations
            .filter(c => c.employee.job_matches.length > 0)
            .map(c => ({
                x: levelToGrade(c.employee.job_matches[0].job_catalog.level),
                y: c.base_salary,
                name: c.employee.full_name
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


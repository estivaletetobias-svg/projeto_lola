import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { SalaryEngineService } from './salary-engine.service';

@Controller('salary-engine')
export class SalaryEngineController {
    private readonly logger = new Logger(SalaryEngineController.name);

    constructor(private readonly salaryEngine: SalaryEngineService) { }

    /**
     * Rota de Teste: Simula o Processamento Estatístico
     * Recebe um conjunto de pontos (x=grade, y=salário) e gera a análise de regressão.
     */
    @Post('test-analysis')
    async testAnalysis(
        @Body() body: {
            points: { x: number; y: number }[],
            stepsCount: number,
            rangeSpread: number
        }
    ) {
        this.logger.log('Receiving request for salary analysis...');
        const { points, stepsCount, rangeSpread } = body;
        return this.processAnalysis(points, stepsCount, rangeSpread);
    }

    @Get('analyze/:snapshotId')
    async analyzeSnapshot(@Param('snapshotId') snapshotId: string) {
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

    private processAnalysis(points: { x: number; y: number }[], stepsCount: number, rangeSpread: number) {
        // 1. Passo 3: Cálculo da Regressão (Lógica Carolina)
        const regression = this.salaryEngine.calculateRegression(points);

        // 2. Passo 4: Sugestão de Tabela Salarial para cada Grade calculada
        const distinctGrades = Array.from(new Set(points.map(p => p.x))).sort((a, b) => a - b);

        const suggestedTable = distinctGrades.map(grade => {
            // Predição da reta de regressão (y = mx + b)
            const predictedMidpoint = regression.slope * grade + regression.intercept;

            const steps = [];
            for (let i = 0; i < (stepsCount || 5); i++) {
                steps.push({
                    stepLabel: String.fromCharCode(65 + i), // A, B, C...
                    value: this.salaryEngine.generateTableEntry(
                        predictedMidpoint,
                        i,
                        stepsCount || 5,
                        rangeSpread || 0.4
                    )
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
}


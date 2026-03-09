import { SalaryEngineService } from './salary-engine.service';
export declare class SalaryEngineController {
    private readonly salaryEngine;
    private readonly logger;
    constructor(salaryEngine: SalaryEngineService);
    testAnalysis(body: {
        points: {
            x: number;
            y: number;
        }[];
        stepsCount: number;
        rangeSpread: number;
    }): Promise<{
        status: string;
        diagnostics: {
            regressionCurve: {
                slope: number;
                intercept: number;
                rSquared: number;
            };
            pointsCount: number;
            recommendation: string;
        };
        suggestedSalaryStructure: {
            grade: string;
            midpoint: number;
            steps: {
                stepLabel: string;
                value: number;
            }[];
        }[];
    }>;
    analyzeSnapshot(snapshotId: string): Promise<{
        status: string;
        diagnostics: {
            regressionCurve: {
                slope: number;
                intercept: number;
                rSquared: number;
            };
            pointsCount: number;
            recommendation: string;
        };
        suggestedSalaryStructure: {
            grade: string;
            midpoint: number;
            steps: {
                stepLabel: string;
                value: number;
            }[];
        }[];
    } | {
        status: string;
        message: string;
    }>;
    private processAnalysis;
}

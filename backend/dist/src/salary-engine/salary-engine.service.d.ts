import { PrismaService } from '../prisma/prisma.service';
export declare class SalaryEngineService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    calculateRegression(data: {
        x: number;
        y: number;
    }[]): {
        slope: number;
        intercept: number;
        rSquared: number;
    };
    getAnalysisPoints(snapshotId: string): Promise<{
        x: number;
        y: number;
        name: string | null;
    }[]>;
    generateTableEntry(midpoint: number, stepIndex: number, totalSteps: number, rangeSpread: number): number;
}

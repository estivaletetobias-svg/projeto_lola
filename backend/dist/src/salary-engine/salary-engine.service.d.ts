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
    generateTableEntry(midpoint: number, stepIndex: number, totalSteps: number, rangeSpread: number): number;
}

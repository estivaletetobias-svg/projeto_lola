import { PrismaService } from '../prisma/prisma.service';
export declare class DiagnosticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardStats(tenantId?: string): Promise<{
        totalEmployees: number;
        avgGap: number;
        monthlyCostP50: number;
        lastSnapshotDate: Date;
        isDemo: boolean;
    } | {
        totalEmployees: number;
        avgGap: number;
        monthlyCostP50: number;
        lastSnapshotDate: null;
        isDemo: boolean;
    }>;
    private getDemoStats;
}

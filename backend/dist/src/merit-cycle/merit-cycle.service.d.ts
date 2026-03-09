import { PrismaService } from '../prisma/prisma.service';
export declare class MeritCycleService {
    private prisma;
    constructor(prisma: PrismaService);
    createSimulation(tenantId: string, snapshotId: string, budget: number, scenarios?: string[]): Promise<Record<string, any>>;
    private runScenario;
}

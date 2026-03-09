import { PrismaService } from '../prisma/prisma.service';
export declare class JobMatchService {
    private prisma;
    constructor(prisma: PrismaService);
    autoMatch(snapshotId: string): Promise<number>;
}

import { PrismaService } from '../prisma/prisma.service';
export declare class JobCatalogService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        family: string;
        title_std: string;
        description: string | null;
        level: string;
        grade: number;
        cbo_code: string | null;
        created_at: Date;
    }[]>;
}

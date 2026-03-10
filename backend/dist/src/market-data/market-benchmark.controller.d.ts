import { PrismaService } from '../prisma/prisma.service';
export declare class MarketBenchmarkController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: string, pageSize?: string, search?: string, level?: string): Promise<{
        data: ({
            job_catalog: {
                family: string;
                title_std: string;
                level: string;
                grade: number;
            };
        } & {
            id: string;
            job_catalog_id: string;
            cnae: string | null;
            company_size_bucket: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            p25: number;
            p50: number;
            p75: number;
            n: number;
            as_of_date: Date;
            source_tag: string | null;
            created_at: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}

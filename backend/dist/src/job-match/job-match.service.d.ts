import { PrismaService } from '../prisma/prisma.service';
export declare class JobMatchService {
    private prisma;
    constructor(prisma: PrismaService);
    getMatchesForSnapshot(snapshotId: string): Promise<{
        employeeId: string;
        employeeName: string | null;
        internalTitle: string;
        match: {
            job_catalog: {
                id: string;
                family: string;
                title_std: string;
                description: string | null;
                level: string;
                grade: number;
                cbo_code: string | null;
                created_at: Date;
            };
        } & {
            id: string;
            created_at: Date;
            job_catalog_id: string;
            snapshot_id: string;
            employee_id: string;
            confidence: number;
            method: string;
            reviewed_by_user_id: string | null;
            reviewed_at: Date | null;
        };
    }[]>;
    upsertMatch(data: {
        employeeId: string;
        snapshotId: string;
        jobCatalogId: string;
        method?: string;
    }): Promise<{
        id: string;
        created_at: Date;
        job_catalog_id: string;
        snapshot_id: string;
        employee_id: string;
        confidence: number;
        method: string;
        reviewed_by_user_id: string | null;
        reviewed_at: Date | null;
    } | null>;
    private similarity;
    suggestMatches(snapshotId: string): Promise<any[]>;
    autoApproveAll(snapshotId: string): Promise<{
        approved: number;
        total: number;
    }>;
    autoMatch(snapshotId: string): Promise<{
        approved: number;
        total: number;
    }>;
}

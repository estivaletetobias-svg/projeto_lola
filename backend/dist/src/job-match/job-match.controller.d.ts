import { JobMatchService } from './job-match.service';
import { JobCatalogService } from '../job-catalog/job-catalog.service';
export declare class JobMatchController {
    private readonly jobMatchService;
    private readonly jobCatalogService;
    constructor(jobMatchService: JobMatchService, jobCatalogService: JobCatalogService);
    getCatalog(): Promise<{
        id: string;
        created_at: Date;
        family: string;
        title_std: string;
        description: string | null;
        level: string;
        grade: number;
        cbo_code: string | null;
    }[]>;
    getMatches(snapshotId: string): Promise<{
        employeeId: string;
        employeeName: string | null;
        internalTitle: string;
        match: {
            job_catalog: {
                id: string;
                created_at: Date;
                family: string;
                title_std: string;
                description: string | null;
                level: string;
                grade: number;
                cbo_code: string | null;
            };
        } & {
            id: string;
            created_at: Date;
            snapshot_id: string;
            employee_id: string;
            job_catalog_id: string;
            confidence: number;
            method: string;
            reviewed_by_user_id: string | null;
            reviewed_at: Date | null;
        };
    }[]>;
    approveMatch(body: {
        employeeId: string;
        snapshotId: string;
        jobCatalogId: string;
        method?: string;
    }): Promise<{
        id: string;
        created_at: Date;
        snapshot_id: string;
        employee_id: string;
        job_catalog_id: string;
        confidence: number;
        method: string;
        reviewed_by_user_id: string | null;
        reviewed_at: Date | null;
    } | null>;
}

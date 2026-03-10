import { PayrollService } from './payroll.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    ping(): {
        status: string;
    };
    createSnapshot(tenantId: string, dto: CreatePayrollSnapshotDto): Promise<{
        snapshot: {
            id: string;
            period_date: Date;
            source_type: string;
            s3_file_key: string;
            status: string;
            created_at: Date;
            tenant_id: string;
        };
        uploadUrl: string;
    }>;
    listSnapshots(tenantId: string): Promise<{
        id: string;
        period_date: Date;
        source_type: string;
        s3_file_key: string;
        status: string;
        created_at: Date;
        tenant_id: string;
    }[]>;
    getSnapshotStatus(tenantId: string, id: string): Promise<{
        import_jobs: {
            id: string;
            status: string;
            snapshot_id: string;
            started_at: Date | null;
            finished_at: Date | null;
            error_log: string | null;
        }[];
    } & {
        id: string;
        period_date: Date;
        source_type: string;
        s3_file_key: string;
        status: string;
        created_at: Date;
        tenant_id: string;
    }>;
    runAnalysis(tenantId: string, id: string): Promise<{
        message: string;
        jobId: string;
    }>;
    uploadLocal(tenantId: string, body: {
        fileName: string;
        periodDate: string;
        data: any[];
    }): Promise<{
        status: string;
        snapshotId: string;
        count: number;
    }>;
}

import { PayrollService } from './payroll.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
export declare class PayrollController {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    createSnapshot(tenantId: string, dto: CreatePayrollSnapshotDto): Promise<{
        snapshot: {
            id: string;
            created_at: Date;
            tenant_id: string;
            period_date: Date;
            source_type: string;
            s3_file_key: string;
            status: import(".prisma/client").$Enums.SnapshotStatus;
        };
        uploadUrl: string;
    }>;
    listSnapshots(tenantId: string): Promise<{
        id: string;
        created_at: Date;
        tenant_id: string;
        period_date: Date;
        source_type: string;
        s3_file_key: string;
        status: import(".prisma/client").$Enums.SnapshotStatus;
    }[]>;
    getSnapshotStatus(tenantId: string, id: string): Promise<{
        import_jobs: {
            id: string;
            status: import(".prisma/client").$Enums.JobStatus;
            started_at: Date | null;
            finished_at: Date | null;
            error_log: import("@prisma/client/runtime/library").JsonValue | null;
            snapshot_id: string;
        }[];
    } & {
        id: string;
        created_at: Date;
        tenant_id: string;
        period_date: Date;
        source_type: string;
        s3_file_key: string;
        status: import(".prisma/client").$Enums.SnapshotStatus;
    }>;
    runAnalysis(tenantId: string, id: string): Promise<{
        message: string;
        jobId: string;
    }>;
}

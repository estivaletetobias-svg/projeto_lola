import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
import { Queue } from 'bullmq';
export declare class PayrollService {
    private prisma;
    private storage;
    private analysisQueue;
    constructor(prisma: PrismaService, storage: StorageService, analysisQueue: Queue);
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
    triggerAnalysis(tenantId: string, id: string): Promise<{
        message: string;
        jobId: string;
    }>;
}

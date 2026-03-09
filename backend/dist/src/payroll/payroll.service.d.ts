import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
import { Queue } from 'bullmq';
import { ImportValidationProcessor } from '../import-validation/import-validation.processor';
export declare class PayrollService {
    private prisma;
    private storage;
    private processor;
    private analysisQueue;
    constructor(prisma: PrismaService, storage: StorageService, processor: ImportValidationProcessor, analysisQueue: Queue);
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
    triggerAnalysis(tenantId: string, id: string): Promise<{
        message: string;
        jobId: string;
    }>;
    createAndProcessLocal(tenantId: string, body: {
        fileName: string;
        periodDate: string;
        data: any[];
    }): Promise<{
        status: string;
        snapshotId: string;
        count: number;
    }>;
}

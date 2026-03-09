import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
export declare class ImportValidationProcessor extends WorkerHost {
    private prisma;
    private storage;
    private readonly logger;
    constructor(prisma: PrismaService, storage: StorageService);
    process(job: Job<any, any, string>): Promise<any>;
    private streamToBuffer;
}

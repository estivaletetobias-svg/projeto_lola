import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SnapshotStatus } from '@prisma/client';

@Injectable()
export class PayrollService {
    constructor(
        private prisma: PrismaService,
        private storage: StorageService,
        @InjectQueue('payroll-analysis') private analysisQueue: Queue,
    ) { }

    async createSnapshot(tenantId: string, dto: CreatePayrollSnapshotDto) {
        const key = `tenants/${tenantId}/snapshots/${Date.now()}-${dto.sourceType.toLowerCase()}`;

        const snapshot = await this.prisma.payrollSnapshot.create({
            data: {
                tenant_id: tenantId,
                period_date: new Date(dto.periodDate),
                source_type: dto.sourceType,
                s3_file_key: key,
                status: 'PENDING',
            },
        });

        const uploadUrl = await this.storage.getPresignedUrl(key);

        return {
            snapshot,
            uploadUrl,
        };
    }

    async listSnapshots(tenantId: string) {
        return this.prisma.payrollSnapshot.findMany({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' },
        });
    }

    async getSnapshotStatus(tenantId: string, id: string) {
        const snapshot = await this.prisma.payrollSnapshot.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                import_jobs: true,
            },
        });

        if (!snapshot) throw new NotFoundException('Snapshot not found');
        return snapshot;
    }

    async triggerAnalysis(tenantId: string, id: string) {
        const snapshot = await this.prisma.payrollSnapshot.findUnique({
            where: { id },
        });

        if (!snapshot || snapshot.tenant_id !== tenantId) {
            throw new NotFoundException('Snapshot not found');
        }

        // Update status to VALIDATING
        await this.prisma.payrollSnapshot.update({
            where: { id },
            data: { status: 'VALIDATING' },
        });

        // Create a job record
        const job = await this.prisma.payrollImportJob.create({
            data: {
                snapshot_id: id,
                status: 'PENDING',
            },
        });

        // Add to BullMQ
        await this.analysisQueue.add('analyze', {
            snapshotId: id,
            jobId: job.id,
            tenantId,
        });

        return { message: 'Analysis started', jobId: job.id };
    }
}

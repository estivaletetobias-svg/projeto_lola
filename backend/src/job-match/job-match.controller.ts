import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { JobMatchService } from './job-match.service';
import { JobCatalogService } from '../job-catalog/job-catalog.service';

@Controller('job-match')
export class JobMatchController {
    constructor(
        private readonly jobMatchService: JobMatchService,
        private readonly jobCatalogService: JobCatalogService
    ) { }

    @Get('catalog')
    async getCatalog() {
        return this.jobCatalogService.findAll();
    }

    @Get(':snapshotId')
    async getMatches(@Param('snapshotId') snapshotId: string) {
        return this.jobMatchService.getMatchesForSnapshot(snapshotId);
    }

    @Post('approve')
    async approveMatch(@Body() body: {
        employeeId: string;
        snapshotId: string;
        jobCatalogId: string;
        method?: string;
    }) {
        return this.jobMatchService.upsertMatch(body);
    }
}

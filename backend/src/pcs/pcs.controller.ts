import { Controller, Get, Query, Param } from '@nestjs/common';
import { PcsService } from './pcs.service';

@Controller('pcs')
export class PcsController {
    constructor(private readonly pcsService: PcsService) {}

    @Get('salary-table')
    async getSalaryTable(
        @Query('inpc') inpc: string,
        @Query('hours') hours: string
    ) {
        let inpcFactor = parseFloat(inpc);
        if (isNaN(inpcFactor)) {
            inpcFactor = await this.pcsService.getLatestInpcFactor();
        }
        return this.pcsService.calculateAdjustedTable(
            inpcFactor,
            parseInt(hours) || 160
        );
    }

    @Get('analysis/:snapshotId')
    async getAnalysis(
        @Param('snapshotId') snapshotId: string,
        @Query('inpc') inpc: string,
        @Query('hours') hours: string
    ) {
        let inpcFactor = parseFloat(inpc);
        if (isNaN(inpcFactor)) {
            inpcFactor = await this.pcsService.getLatestInpcFactor();
        }
        return this.pcsService.analyzeSalaryPositioning(
            snapshotId,
            inpcFactor,
            parseInt(hours) || 160
        );
    }

    @Get('impact/:snapshotId')
    async getImpact(
        @Param('snapshotId') snapshotId: string,
        @Query('inpc') inpc: string,
        @Query('hours') hours: string
    ) {
        let inpcFactor = parseFloat(inpc);
        if (isNaN(inpcFactor)) {
            inpcFactor = await this.pcsService.getLatestInpcFactor();
        }
        return this.pcsService.calculateImpact(
            snapshotId,
            inpcFactor,
            parseInt(hours) || 160
        );
    }
}

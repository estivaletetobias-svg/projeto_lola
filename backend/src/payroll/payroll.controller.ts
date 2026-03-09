import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CreatePayrollSnapshotDto } from './dto/create-snapshot.dto';
import { GetTenant } from '../auth/get-user.decorator';
import { AuthGuard } from '../auth/auth.guard';

@Controller('payroll')
@UseGuards(AuthGuard)
export class PayrollController {
    constructor(private readonly payrollService: PayrollService) { }

    @Post('snapshots')
    async createSnapshot(
        @GetTenant() tenantId: string,
        @Body() dto: CreatePayrollSnapshotDto,
    ) {
        return this.payrollService.createSnapshot(tenantId, dto);
    }

    @Get('snapshots')
    async listSnapshots(@GetTenant() tenantId: string) {
        return this.payrollService.listSnapshots(tenantId);
    }

    @Get('snapshots/:id/status')
    async getSnapshotStatus(
        @GetTenant() tenantId: string,
        @Param('id') id: string,
    ) {
        return this.payrollService.getSnapshotStatus(tenantId, id);
    }

    @Post('snapshots/:id/run-analysis')
    async runAnalysis(
        @GetTenant() tenantId: string,
        @Param('id') id: string,
    ) {
        return this.payrollService.triggerAnalysis(tenantId, id);
    }

    @Post('upload-local')
    async uploadLocal(
        @GetTenant() tenantId: string,
        @Body() body: { fileName: string, periodDate: string, data: any[] }
    ) {
        // This is a helper for the "Manda ver" mode where we bypass complex upload flows
        return this.payrollService.createAndProcessLocal(tenantId, body);
    }
}

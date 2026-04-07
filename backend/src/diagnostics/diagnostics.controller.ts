import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diagnostics')
export class DiagnosticsController {
    constructor(private readonly diagnosticsService: DiagnosticsService) { }

    @Get('dashboard-stats')
    async getStats() {
        // Alinhado com o tenantId do seed.ts para a demonstração
        const tenantId = 'demo-tenant-id';
        return this.diagnosticsService.getDashboardStats(tenantId);
    }
}

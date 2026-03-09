import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diagnostics')
export class DiagnosticsController {
    constructor(private readonly diagnosticsService: DiagnosticsService) { }

    @Get('dashboard-stats')
    async getStats() {
        // Em um cenário real usaríamos o tenantId do usuário logado
        // Para o teste, vamos usar um ID fixo ou o primeiro tenant encontrado
        const tenantId = 'dummy-tenant-id';
        return this.diagnosticsService.getDashboardStats(tenantId);
    }
}

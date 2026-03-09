import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiagnosticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats(tenantId?: string) {
        // Fetch the first tenant if no ID provided (for testing)
        if (!tenantId || tenantId === 'dummy-tenant-id') {
            const tenant = await this.prisma.tenant.findFirst();
            if (!tenant) return this.getDemoStats();
            tenantId = tenant.id;
        }

        // 1. Pegar o último snapshot processado (status READY no Prisma)
        const lastSnapshot = await this.prisma.payrollSnapshot.findFirst({
            where: { tenant_id: tenantId, status: 'READY' },
            orderBy: { period_date: 'desc' },
        });

        if (!lastSnapshot) {
            return {
                totalEmployees: 0,
                avgGap: 0,
                monthlyCostP50: 0,
                lastSnapshotDate: null,
                isDemo: true
            };
        }

        // 2. Contar colaboradores desse snapshot
        const totalEmployees = await this.prisma.compensation.count({
            where: { snapshot_id: lastSnapshot.id }
        });

        // 3. Cálculo simplificado de Gap e Custo (No MVP real isso usaria benchmarks)
        // Por enquanto, vamos retornar dados reais do banco onde possível
        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: lastSnapshot.id }
        });

        const totalPayroll = compensations.reduce((acc, c) => acc + c.total_cash, 0);

        return {
            totalEmployees,
            avgGap: -12.5, // Exemplo: Isso virá do motor de benchmarking
            monthlyCostP50: totalPayroll * 0.08, // Exemplo: 8% de ajuste
            lastSnapshotDate: lastSnapshot.period_date,
            isDemo: false
        };
    }

    private getDemoStats() {
        return {
            totalEmployees: 30,
            avgGap: -8.4,
            monthlyCostP50: 14200,
            lastSnapshotDate: new Date('2026-03-01'),
            isDemo: true
        };
    }
}

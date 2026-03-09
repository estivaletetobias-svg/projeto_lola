"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DiagnosticsService = class DiagnosticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats(tenantId) {
        if (!tenantId || tenantId === 'dummy-tenant-id') {
            const tenant = await this.prisma.tenant.findFirst();
            if (!tenant)
                return this.getDemoStats();
            tenantId = tenant.id;
        }
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
        const totalEmployees = await this.prisma.compensation.count({
            where: { snapshot_id: lastSnapshot.id }
        });
        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: lastSnapshot.id }
        });
        const totalPayroll = compensations.reduce((acc, c) => acc + c.total_cash, 0);
        return {
            totalEmployees,
            avgGap: -12.5,
            monthlyCostP50: totalPayroll * 0.08,
            lastSnapshotDate: lastSnapshot.period_date,
            isDemo: false
        };
    }
    getDemoStats() {
        return {
            totalEmployees: 30,
            avgGap: -8.4,
            monthlyCostP50: 14200,
            lastSnapshotDate: new Date('2026-03-01'),
            isDemo: true
        };
    }
};
exports.DiagnosticsService = DiagnosticsService;
exports.DiagnosticsService = DiagnosticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiagnosticsService);
//# sourceMappingURL=diagnostics.service.js.map
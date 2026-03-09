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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const payroll_service_1 = require("./payroll.service");
const create_snapshot_dto_1 = require("./dto/create-snapshot.dto");
const get_user_decorator_1 = require("../auth/get-user.decorator");
let PayrollController = class PayrollController {
    payrollService;
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    ping() { return { status: 'ok' }; }
    async createSnapshot(tenantId, dto) {
        return this.payrollService.createSnapshot(tenantId, dto);
    }
    async listSnapshots(tenantId) {
        return this.payrollService.listSnapshots(tenantId);
    }
    async getSnapshotStatus(tenantId, id) {
        return this.payrollService.getSnapshotStatus(tenantId, id);
    }
    async runAnalysis(tenantId, id) {
        return this.payrollService.triggerAnalysis(tenantId, id);
    }
    async uploadLocal(tenantId, body) {
        console.log(`--- UPLOAD RECEBIDO: ${body.fileName} (${body.data?.length} linhas) ---`);
        try {
            const result = await this.payrollService.createAndProcessLocal(tenantId, body);
            console.log(`--- UPLOAD PROCESSADO COM SUCESSO ---`);
            return result;
        }
        catch (e) {
            console.error(`--- ERRO NO UPLOAD: ${e.message} ---`);
            throw e;
        }
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PayrollController.prototype, "ping", null);
__decorate([
    (0, common_1.Post)('snapshots'),
    __param(0, (0, get_user_decorator_1.GetTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_snapshot_dto_1.CreatePayrollSnapshotDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "createSnapshot", null);
__decorate([
    (0, common_1.Get)('snapshots'),
    __param(0, (0, get_user_decorator_1.GetTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "listSnapshots", null);
__decorate([
    (0, common_1.Get)('snapshots/:id/status'),
    __param(0, (0, get_user_decorator_1.GetTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "getSnapshotStatus", null);
__decorate([
    (0, common_1.Post)('snapshots/:id/run-analysis'),
    __param(0, (0, get_user_decorator_1.GetTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "runAnalysis", null);
__decorate([
    (0, common_1.Post)('upload-local'),
    __param(0, (0, get_user_decorator_1.GetTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "uploadLocal", null);
exports.PayrollController = PayrollController = __decorate([
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map
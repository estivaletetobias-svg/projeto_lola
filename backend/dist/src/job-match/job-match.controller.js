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
exports.JobMatchController = void 0;
const common_1 = require("@nestjs/common");
const job_match_service_1 = require("./job-match.service");
const job_catalog_service_1 = require("../job-catalog/job-catalog.service");
let JobMatchController = class JobMatchController {
    jobMatchService;
    jobCatalogService;
    constructor(jobMatchService, jobCatalogService) {
        this.jobMatchService = jobMatchService;
        this.jobCatalogService = jobCatalogService;
    }
    async getCatalog() {
        return this.jobCatalogService.findAll();
    }
    async getMatches(snapshotId) {
        return this.jobMatchService.getMatchesForSnapshot(snapshotId);
    }
    async approveMatch(body) {
        return this.jobMatchService.upsertMatch(body);
    }
};
exports.JobMatchController = JobMatchController;
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobMatchController.prototype, "getCatalog", null);
__decorate([
    (0, common_1.Get)(':snapshotId'),
    __param(0, (0, common_1.Param)('snapshotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobMatchController.prototype, "getMatches", null);
__decorate([
    (0, common_1.Post)('approve'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JobMatchController.prototype, "approveMatch", null);
exports.JobMatchController = JobMatchController = __decorate([
    (0, common_1.Controller)('job-match'),
    __metadata("design:paramtypes", [job_match_service_1.JobMatchService,
        job_catalog_service_1.JobCatalogService])
], JobMatchController);
//# sourceMappingURL=job-match.controller.js.map
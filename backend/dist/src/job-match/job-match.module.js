"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobMatchModule = void 0;
const common_1 = require("@nestjs/common");
const job_match_controller_1 = require("./job-match.controller");
const job_match_service_1 = require("./job-match.service");
const job_catalog_module_1 = require("../job-catalog/job-catalog.module");
let JobMatchModule = class JobMatchModule {
};
exports.JobMatchModule = JobMatchModule;
exports.JobMatchModule = JobMatchModule = __decorate([
    (0, common_1.Module)({
        imports: [job_catalog_module_1.JobCatalogModule],
        controllers: [job_match_controller_1.JobMatchController],
        providers: [job_match_service_1.JobMatchService],
        exports: [job_match_service_1.JobMatchService],
    })
], JobMatchModule);
//# sourceMappingURL=job-match.module.js.map
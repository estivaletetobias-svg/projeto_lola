"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const payroll_module_1 = require("./payroll/payroll.module");
const import_validation_module_1 = require("./import-validation/import-validation.module");
const job_catalog_module_1 = require("./job-catalog/job-catalog.module");
const job_match_module_1 = require("./job-match/job-match.module");
const market_data_module_1 = require("./market-data/market-data.module");
const diagnostics_module_1 = require("./diagnostics/diagnostics.module");
const merit_cycle_module_1 = require("./merit-cycle/merit-cycle.module");
const copilot_module_1 = require("./copilot/copilot.module");
const prisma_module_1 = require("./prisma/prisma.module");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_pino_1 = require("nestjs-pino");
const storage_module_1 = require("./storage/storage.module");
const salary_engine_module_1 = require("./salary-engine/salary-engine.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            nestjs_pino_1.LoggerModule.forRoot(),
            bullmq_1.BullModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                        password: config.get('REDIS_PASSWORD'),
                        maxRetriesPerRequest: null,
                        connectTimeout: 2000,
                        retryStrategy: (times) => {
                            if (times > 3)
                                return null;
                            return Math.min(times * 100, 2000);
                        }
                    },
                }),
            }),
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            payroll_module_1.PayrollModule,
            import_validation_module_1.ImportValidationModule,
            job_catalog_module_1.JobCatalogModule,
            job_match_module_1.JobMatchModule,
            market_data_module_1.MarketDataModule,
            diagnostics_module_1.DiagnosticsModule,
            merit_cycle_module_1.MeritCycleModule,
            copilot_module_1.CopilotModule,
            prisma_module_1.PrismaModule,
            storage_module_1.StorageModule,
            salary_engine_module_1.SalaryEngineModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
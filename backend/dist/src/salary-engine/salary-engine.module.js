"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalaryEngineModule = void 0;
const common_1 = require("@nestjs/common");
const salary_engine_service_1 = require("./salary-engine.service");
const salary_engine_controller_1 = require("./salary-engine.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let SalaryEngineModule = class SalaryEngineModule {
};
exports.SalaryEngineModule = SalaryEngineModule;
exports.SalaryEngineModule = SalaryEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [salary_engine_controller_1.SalaryEngineController],
        providers: [salary_engine_service_1.SalaryEngineService],
        exports: [salary_engine_service_1.SalaryEngineService],
    })
], SalaryEngineModule);
//# sourceMappingURL=salary-engine.module.js.map
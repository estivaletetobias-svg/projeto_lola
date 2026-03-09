"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeritCycleModule = void 0;
const common_1 = require("@nestjs/common");
const merit_cycle_controller_1 = require("./merit-cycle.controller");
const merit_cycle_service_1 = require("./merit-cycle.service");
let MeritCycleModule = class MeritCycleModule {
};
exports.MeritCycleModule = MeritCycleModule;
exports.MeritCycleModule = MeritCycleModule = __decorate([
    (0, common_1.Module)({
        controllers: [merit_cycle_controller_1.MeritCycleController],
        providers: [merit_cycle_service_1.MeritCycleService]
    })
], MeritCycleModule);
//# sourceMappingURL=merit-cycle.module.js.map
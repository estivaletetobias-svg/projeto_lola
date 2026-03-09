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
exports.CopilotController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../auth/auth.guard");
const get_user_decorator_1 = require("../auth/get-user.decorator");
let CopilotController = class CopilotController {
    async chat(tenantId, message) {
        if (message.toLowerCase().includes('resumo') || message.toLowerCase().includes('diagnóstico')) {
            return {
                reply: `### Resumo Executivo para ${tenantId}\n\nIdentificamos que **12% da sua folha** está abaixo do P25 de mercado. O impacto financeiro para alinhar todos ao P50 é de aproximadamente **R$ 14.200/mês**.\n\nSugiro revisar as áreas de **Tecnologia** e **Produto**, que apresentam os maiores gaps (média de -18%).`,
                actions: ['Ver Diagnóstico Completo', 'Simular Ajuste P50'],
            };
        }
        return {
            reply: "Olá! Sou o assistente SinSalarial. Posso te ajudar a entender seus diagnósticos de remuneração ou sugerir cenários de mérito. O que deseja saber?",
        };
    }
};
exports.CopilotController = CopilotController;
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, get_user_decorator_1.GetTenant)()),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopilotController.prototype, "chat", null);
exports.CopilotController = CopilotController = __decorate([
    (0, common_1.Controller)('copilot'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard)
], CopilotController);
//# sourceMappingURL=copilot.controller.js.map
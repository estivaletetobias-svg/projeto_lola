import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { GetTenant } from '../auth/get-user.decorator';

@Controller('copilot')
@UseGuards(AuthGuard)
export class CopilotController {

    @Post('chat')
    async chat(@GetTenant() tenantId: string, @Body('message') message: string) {
        // For MVP: Simple deterministic response mock
        // In production, this would call OpenAI/Gemini with Tool Calling
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
}

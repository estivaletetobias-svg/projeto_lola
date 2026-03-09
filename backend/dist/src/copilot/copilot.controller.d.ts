export declare class CopilotController {
    chat(tenantId: string, message: string): Promise<{
        reply: string;
        actions: string[];
    } | {
        reply: string;
        actions?: undefined;
    }>;
}

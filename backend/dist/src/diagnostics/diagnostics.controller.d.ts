import { DiagnosticsService } from './diagnostics.service';
export declare class DiagnosticsController {
    private readonly diagnosticsService;
    constructor(diagnosticsService: DiagnosticsService);
    getStats(): Promise<{
        totalEmployees: number;
        avgGap: number;
        monthlyCostP50: number;
        lastSnapshotDate: Date;
        isDemo: boolean;
    } | {
        totalEmployees: number;
        avgGap: number;
        monthlyCostP50: number;
        lastSnapshotDate: null;
        isDemo: boolean;
    }>;
}

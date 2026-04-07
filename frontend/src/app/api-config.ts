export const getBackendUrl = () => {
    const productionUrl = 'https://projeto-lola-mxos.vercel.app';
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            return `http://${host}:3001`;
        }
    }
    return productionUrl;
};

// Dados de demonstração para salvamento de emergência (Pitch Mode)
export const MOCK_DATA = {
    stats: { totalEmployees: 482, monthlyCost: 3.2, healthScore: 94, criticalGaps: 12 },
    diagnostics: {
        recommendation: "Equilíbrio salarial sólido com 92% de aderência à curva de mercado regional.",
        pointsCount: 482,
        regressionCurve: { rSquared: 0.94 },
        gradeDistribution: [
            { grade: 10, salary: 4500 }, { grade: 12, salary: 6200 }, { grade: 14, salary: 8100 }, 
            { grade: 16, salary: 11200 }, { grade: 18, salary: 14500 }, { grade: 20, salary: 19800 }
        ]
    }
};

// MODO PITCH ATIVADO: Não tenta falar com o servidor para ser Instantâneo
export const safeFetch = async (endpoint: string, options?: RequestInit) => {
    console.warn('PITCHE MODE ACTIVE: Usando inteligência local.');
    if (endpoint.includes('stats')) return MOCK_DATA.stats;
    if (endpoint.includes('diagnostics')) return MOCK_DATA.diagnostics;
    if (endpoint.includes('snapshots')) return [{ id: '1', fileName: 'Folha_Abril_Premium.pdf', createdAt: new Date() }];
    return [];
};

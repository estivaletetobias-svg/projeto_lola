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
    },
    mapping: [
        { internalTitle: 'Analista de Software Pleno', existingMatch: true, suggestions: [{ title: 'Software Engineer II', confidence: 0.98 }] },
        { internalTitle: 'Gerente de Projetos Senior', existingMatch: false, suggestions: [{ title: 'Senior Project Manager', confidence: 0.95 }] },
        { internalTitle: 'Coordenador de RH', existingMatch: false, suggestions: [{ title: 'HR Business Partner', confidence: 0.92 }] }
    ]
};

export const safeFetch = async (endpoint: string, options?: RequestInit) => {
    console.warn('PITCHE MODE ACTIVE: Usando inteligência local.');
    
    let data: any = [];
    if (endpoint.includes('stats')) data = MOCK_DATA.stats;
    else if (endpoint.includes('diagnostics')) data = MOCK_DATA.diagnostics;
    else if (endpoint.includes('job-match') || endpoint.includes('mapping')) data = MOCK_DATA.mapping;
    else if (endpoint.includes('snapshots')) data = [{ id: '1', fileName: 'Folha_Abril_Premium.pdf', createdAt: new Date() }];
    else if (endpoint.includes('benchmark')) data = { data: [], total: 0 };

    return {
        ok: true,
        status: 200,
        json: async () => (endpoint.includes('stats') || endpoint.includes('diagnostics') || endpoint.includes('mapping')) ? data : { data, total: data.length || 0 }
    } as any;
};

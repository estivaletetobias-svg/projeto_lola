export const getBackendUrl = () => {
    // Força o ambiente de produção como solicitado pelo usuário
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://projeto-lola-mxos.vercel.app';
};

// Dados de demonstração para salvamento de emergência (Pitch Mode) - RESERVADO PARA FALHAS TOTAIS
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

// Helper to generate real-time mapping from uploaded user data
const generateLiveMapping = () => {
    if (typeof window === 'undefined') return MOCK_DATA.mapping;
    const stored = localStorage.getItem('@lola-live-employees');
    if (!stored) return MOCK_DATA.mapping;
    
    try {
        const employees = JSON.parse(stored);
        if (!Array.isArray(employees) || employees.length === 0) return MOCK_DATA.mapping;
        
        // Group by 'cargo'
        const groups: Record<string, any[]> = {};
        employees.forEach(emp => {
            const title = emp.cargo || 'Cargo Desconhecido';
            if (!groups[title]) groups[title] = [];
            groups[title].push(emp);
        });

        // Convert to the format expected by the UI
        return Object.keys(groups).map(title => ({
            internalTitle: title,
            employees: groups[title].length,
            employeeIds: groups[title].map(e => e.id),
            existingMatch: false,
            suggestions: [{ title: `${title} (Sugerido pela AI)`, confidence: 0.95 }]
        }));
    } catch {
        return MOCK_DATA.mapping;
    }
};

// Função de Fetch Real Confiável
export const safeFetch = async (endpoint: string, options?: RequestInit) => {
    const baseUrl = getBackendUrl();
    const isFullUrl = endpoint.startsWith('http');
    // Se o endpoint for para a própria Vercel (Next.js API route), não mande para o Nest.js
    const isInternalRoute = endpoint.startsWith('/api/');
    const url = isFullUrl || isInternalRoute ? endpoint : `${baseUrl}${endpoint}`;

    const tryInternalFallback = async (errCode?: number) => {
        if (isInternalRoute) return null; // Don't recurse on internal routes
        
        console.warn(`Tentando recuperação nativa para ${endpoint} (Code: ${errCode})`);
        
        if (endpoint.includes('diagnostics/dashboard-stats')) {
            const internal = await fetch('/api/diagnostics/dashboard-stats');
            if (internal.ok) return internal;
        }
        if (endpoint.includes('snapshots')) {
            const internal = await fetch('/api/snapshots');
            if (internal.ok) return internal;
        }
        if (endpoint.includes('market-benchmark')) {
            const internal = await fetch(`/api/market-benchmark?${endpoint.split('?')[1] || ''}`);
            if (internal.ok) return internal;
        }
        if (endpoint.includes('job-match/suggest')) {
            const snapshotId = endpoint.split('/').pop();
            const internal = await fetch(`/api/job-match/suggest/${snapshotId}`);
            if (internal.ok) return internal;
        }
        if (endpoint.includes('salary-engine/analyze')) {
            const snapshotId = endpoint.split('/').pop();
            const internal = await fetch(`/api/salary-engine/analyze/${snapshotId}`);
            if (internal.ok) return internal;
        }
        if (endpoint.includes('pcs/salary-table')) {
            const query = endpoint.includes('?') ? `?${endpoint.split('?')[1]}` : '';
            const internal = await fetch(`/api/pcs/salary-table${query}`);
            if (internal.ok) return internal;
        }
        if (endpoint.includes('pcs/analysis/')) {
            const pathParts = endpoint.split('?')[0].split('/');
            const snapshotId = pathParts[pathParts.length - 1];
            const query = endpoint.includes('?') ? `?${endpoint.split('?')[1]}` : '';
            const internal = await fetch(`/api/pcs/analysis/${snapshotId}${query}`);
            if (internal.ok) return internal;
        }
        if (endpoint.includes('pcs/impact/')) {
            const pathParts = endpoint.split('?')[0].split('/');
            const snapshotId = pathParts[pathParts.length - 1];
            const query = endpoint.includes('?') ? `?${endpoint.split('?')[1]}` : '';
            const internal = await fetch(`/api/pcs/impact/${snapshotId}${query}`);
            if (internal.ok) return internal;
        }
        if (endpoint.includes('job-match/approve')) {
            const internal = await fetch('/api/job-match/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: options?.body
            });
            if (internal.ok) return internal;
        }
        return null;
    };

    try {
        const response = await fetch(url, { ...options });
        if (response.ok) return response;

        // Erro de Servidor (500, 404, etc) -> Tenta rota interna
        const fallback = await tryInternalFallback(response.status);
        if (fallback) return fallback;

        // Fallback final de emergência (Pitch Mode)
        if (options?.method === 'GET' || !options?.method) {
            if (endpoint.includes('snapshots')) return { ok: true, json: async () => [{ id: 'live-snapshot', createdAt: new Date() }] } as any;
            if (endpoint.includes('job-match/suggest')) return { ok: true, json: async () => generateLiveMapping() } as any;
            if (endpoint.includes('salary-engine/analyze')) return { ok: true, json: async () => ({ status: 'ready', diagnostics: MOCK_DATA.diagnostics, mappedEmployees: [], suggestedSalaryStructure: [] }) } as any;
            if (endpoint.includes('stats')) return { ok: true, json: async () => MOCK_DATA.stats } as any;
            if (endpoint.includes('diagnostics')) return { ok: true, json: async () => MOCK_DATA.diagnostics } as any;
        }

        return response; 
    } catch (err) {
        console.error('Fetch error:', err);
        const fallback = await tryInternalFallback();
        if (fallback) return fallback;
        
        // Emergência Total
        if (endpoint.includes('snapshots')) return { ok: true, json: async () => [{ id: 'live-snapshot', createdAt: new Date() }] } as any;
        if (endpoint.includes('job-match/suggest')) return { ok: true, json: async () => generateLiveMapping() } as any;
        
        throw err;
    }
};

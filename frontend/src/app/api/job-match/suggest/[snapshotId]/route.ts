import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ snapshotId: string }> }
) {
    try {
        const { snapshotId } = await params;

        // Busca colaboradores com compensação e job_match existente
        const compensations = await prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: {
                employee: {
                    include: {
                        job_matches: {
                            include: { job_catalog: true },
                            orderBy: { created_at: 'desc' },
                            take: 1,
                        }
                    }
                }
            },
            orderBy: { employee: { area: 'asc' } }
        });

        if (!compensations.length) return NextResponse.json([]);

        // Busca top 5 sugestões do catálogo para cada cargo interno
        const catalog = await prisma.jobCatalog.findMany({
            orderBy: { title_std: 'asc' }
        });

        const data = compensations.map(c => {
            const emp = c.employee;
            const existingMatch = emp.job_matches[0] || null;
            const internalTitle = emp.area || 'Cargo Desconhecido';

            // Fuzzy match: procura cargos do catálogo com palavras em comum
            const internalWords = internalTitle.toLowerCase()
                .replace(/[^a-záéíóúâêîôûãõç\s]/gi, ' ')
                .split(/\s+/)
                .filter(w => w.length > 3);

            const scored = catalog.map(item => {
                const catalogWords = item.title_std.toLowerCase().split(/\s+/);
                const matchCount = internalWords.filter(w =>
                    catalogWords.some(cw => cw.includes(w) || w.includes(cw))
                ).length;
                const score = internalWords.length > 0 ? matchCount / internalWords.length : 0;
                return { ...item, score };
            }).sort((a, b) => b.score - a.score).slice(0, 5);

            return {
                employeeId: emp.id,
                employeeKey: emp.employee_key,
                displayName: emp.full_name || `Cód. ${emp.employee_key}`,
                internalTitle,
                department: emp.department || null,
                seniority: emp.seniority || null,
                salary: c.base_salary,
                hours: emp.monthly_hours || null,
                validated: !!existingMatch,
                existingMatch: existingMatch ? {
                    id: existingMatch.id,
                    jobCatalogId: existingMatch.job_catalog_id,
                    jobTitle: existingMatch.job_catalog.title_std,
                    level: existingMatch.job_catalog.level,
                    family: existingMatch.job_catalog.family,
                    description: existingMatch.job_catalog.description || null,
                    method: existingMatch.method,
                } : null,
                suggestions: scored.filter(s => s.score > 0).map(s => ({
                    jobCatalogId: s.id,
                    jobTitle: s.title_std,
                    level: s.level,
                    family: s.family,
                    description: s.description || null,
                    confidence: Math.round(s.score * 100),
                })),
            };
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error in job-match suggest:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

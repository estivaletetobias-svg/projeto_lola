import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const LEVEL_LABELS: Record<string, string> = {
    ANY: 'Indiferente', JUNIOR: 'Júnior', PLENO: 'Pleno',
    SENIOR: 'Sênior', INTERN: 'Estagiário',
    COORD: 'Coordenador', MANAGER: 'Gerente', DIRECTOR: 'Diretor',
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.toLowerCase().trim() || '';
        const level  = searchParams.get('level')?.toUpperCase() || '';
        const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const pageSize = 50;

        // Filtra no banco, com busca por título ou família
        const where: any = {};

        if (search) {
            where.OR = [
                { title_std: { contains: search, mode: 'insensitive' } },
                { family:    { contains: search, mode: 'insensitive' } },
            ];
        }

        if (level && level !== 'ALL') {
            where.level = level;
        }

        const [total, catalogs] = await Promise.all([
            prisma.jobCatalog.count({ where }),
            prisma.jobCatalog.findMany({
                where,
                skip:  (page - 1) * pageSize,
                take:  pageSize,
                orderBy: [{ family: 'asc' }, { grade: 'asc' }, { title_std: 'asc' }],
                include: {
                    market_benchmarks: {
                        orderBy: { as_of_date: 'desc' },
                        take: 1, // Pega o mais recente por cargo
                    }
                }
            })
        ]);

        // Formata no mesmo shape que o frontend espera
        const data = catalogs
            .filter(c => c.market_benchmarks.length > 0)
            .map(c => {
                const bm = c.market_benchmarks[0];
                return {
                    id: bm.id,
                    job_catalog: {
                        id:        c.id,
                        title_std: c.title_std,
                        level:     c.level,
                        level_label: LEVEL_LABELS[c.level] || c.level,
                        family:    c.family,
                        grade:     c.grade,
                        cbo_code:  c.cbo_code,
                    },
                    p25:        Math.round(bm.p25),
                    p50:        Math.round(bm.p50),
                    p75:        Math.round(bm.p75),
                    n:          bm.n,
                    as_of_date: bm.as_of_date,
                    source_tag: bm.source_tag,
                };
            });

        return NextResponse.json({
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        });

    } catch (error: any) {
        console.error('Error in market-benchmark API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

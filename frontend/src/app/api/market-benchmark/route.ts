import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.toLowerCase() || '';

        // EXPANDED DATA: Including roles found in current user snapshot and general admin/sales roles
        const SEED_BENCHMARKS = [
            // TECH
            { id: 'b1', job_catalog: { title_std: 'Software Engineer', level: 'SENIOR', family: 'Engineering', grade: 16 }, p25: 14500, p50: 16800, p75: 19500, n: 482, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b2', job_catalog: { title_std: 'Software Engineer', level: 'PLENO', family: 'Engineering', grade: 14 }, p25: 10200, p50: 12500, p75: 14800, n: 1240, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b22', job_catalog: { title_std: 'Analista Frontend', level: 'JUNIOR', family: 'Engineering', grade: 12 }, p25: 4500, p50: 5200, p75: 6100, n: 342, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b3', job_catalog: { title_std: 'Product Manager', level: 'SENIOR', family: 'Product', grade: 16 }, p25: 15800, p50: 18500, p75: 22000, n: 312, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            
            // MARKETING & DESIGN
            { id: 'b5', job_catalog: { title_std: 'UX Designer', level: 'PLENO', family: 'Design', grade: 14 }, p25: 9800, p50: 11200, p75: 13500, n: 245, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b55', job_catalog: { title_std: 'Assistente de Marketing', level: 'SENIOR', family: 'Marketing', grade: 12 }, p25: 4200, p50: 4800, p75: 5600, n: 184, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            
            // SALES
            { id: 'b6', job_catalog: { title_std: 'Analista de Pré-Vendas', level: 'JUNIOR', family: 'Sales', grade: 11 }, p25: 3200, p50: 3800, p75: 4500, n: 215, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b7', job_catalog: { title_std: 'Executivo de Contas', level: 'PLENO', family: 'Sales', grade: 15 }, p25: 8500, p50: 9800, p75: 12100, n: 890, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            
            // ADMIN & OPS
            { id: 'b8', job_catalog: { title_std: 'Assistente Administrativo', level: 'PLENO', family: 'Admin', grade: 10 }, p25: 2800, p50: 3200, p75: 3800, n: 3420, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b9', job_catalog: { title_std: 'Analista Financeiro', level: 'SENIOR', family: 'Finance', grade: 15 }, p25: 7800, p50: 9100, p75: 10800, n: 567, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b10', job_catalog: { title_std: 'Gerente de Operações', level: 'MANAGER', family: 'Ops', grade: 18 }, p25: 14200, p50: 16500, p75: 19800, n: 124, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' },
            { id: 'b4', job_catalog: { title_std: 'Cientista de Dados', level: 'SENIOR', family: 'Data', grade: 17 }, p25: 16500, p50: 19200, p75: 23500, n: 156, as_of_date: '2025-03-01', source_tag: 'Lola Intelligence' }
        ];

        const filtered = SEED_BENCHMARKS.filter(b => 
            b.job_catalog.title_std.toLowerCase().includes(search) || 
            b.job_catalog.family.toLowerCase().includes(search)
        );

        return NextResponse.json({
            data: filtered,
            total: filtered.length,
            page: 1,
            pageSize: 10
        });

    } catch (error: any) {
        console.error('Error in market-benchmark API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

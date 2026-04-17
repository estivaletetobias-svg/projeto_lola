import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// ── Mapa senioridade PT → enum ────────────────────────────────────
const SENIORITY_MAP: Record<string, string> = {
    'indiferente': 'ANY',
    'júnior': 'JUNIOR', 'junior': 'JUNIOR',
    'pleno': 'PLENO',
    'sênior': 'SENIOR', 'senior': 'SENIOR',
    'estagiário': 'INTERN', 'estagiario': 'INTERN',
    'coordenador': 'COORD',
    'gerente': 'MANAGER',
    'diretor': 'DIRECTOR',
};

function inferFamily(title: string): string {
    const t = title.toLowerCase();
    if (/engenheiro|desenvolvedor|programador|frontend|backend|fullstack|software|devops|sre|cloud|rede|infraestrutura|banco de dados|segurança/.test(t)) return 'Engineering';
    if (/cient.*dados|data science|machine learn|intelig.*artif|bi |business int/.test(t)) return 'Data';
    if (/product|produto|ux|design/.test(t)) return 'Design';
    if (/marketing|marca|conteúdo|social|seo|mídia/.test(t)) return 'Marketing';
    if (/comercial|vendas|account|pré.venda|executivo de conta|representante/.test(t)) return 'Sales';
    if (/financeiro|finanças|contábil|fiscal|controlling|tesour|custos/.test(t)) return 'Finance';
    if (/\brh\b|recursos humanos|people|talent|gente|recrut|seleção/.test(t)) return 'HR';
    if (/jurídic|advogado|compli/.test(t)) return 'Legal';
    if (/operações|logística|supply|qualidade|processos/.test(t)) return 'Operations';
    if (/gerente|diretor|ceo|cto|cfo|head of/.test(t)) return 'Leadership';
    return 'Admin';
}

function inferGrade(p50: number): number {
    if (p50 >= 22000) return 22;
    if (p50 >= 18000) return 21;
    if (p50 >= 14000) return 20;
    if (p50 >= 11000) return 19;
    if (p50 >= 9000)  return 18;
    if (p50 >= 7500)  return 17;
    if (p50 >= 6000)  return 16;
    if (p50 >= 5000)  return 15;
    if (p50 >= 4200)  return 14;
    if (p50 >= 3500)  return 13;
    if (p50 >= 3000)  return 12;
    if (p50 >= 2600)  return 11;
    return 10;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const snapshotId = formData.get('snapshotId') as string | null;
        const targetHoursRaw = formData.get('targetHours') as string | null;
        const targetHours = parseInt(targetHoursRaw || '220');

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        // Parse do XLS/XLSX em memória
        const buffer = Buffer.from(await file.arrayBuffer());
        const wb = XLSX.read(buffer, { type: 'buffer' });

        // Localiza aba de dados — aceita "Cargos e Salários" ou a segunda aba
        const sheetName = wb.SheetNames.find(n =>
            n.toLowerCase().includes('cargo') || n.toLowerCase().includes('salário')
        ) || wb.SheetNames[1] || wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Localiza linha de header (procura "Nome do Cargo" ou "Código")
        const headerIdx = rows.findIndex(r =>
            r.some((c: any) => String(c).toLowerCase().includes('nome do cargo') || String(c).toLowerCase() === 'código')
        );

        if (headerIdx === -1) {
            return NextResponse.json({ error: 'Formato de pesquisa não reconhecido. Verifique se o arquivo contém a aba "Cargos e Salários".' }, { status: 422 });
        }

        const header: string[] = rows[headerIdx].map((c: any) => String(c).toLowerCase().trim());

        // Mapeamento de colunas por nome
        const col = (name: string) => {
            const patterns: Record<string, string[]> = {
                code:       ['código', 'code', 'cod'],
                title:      ['nome do cargo', 'cargo', 'title'],
                internalTitle: ['nome do cargo na sua empresa', 'cargo interno', 'seu cargo'],
                seniority:  ['senioridade', 'nível', 'nivel', 'level'],
                nEmpresas:  ['dados estatísticos - empresas', 'empresas', 'n empresas'],
                nSalarios:  ['dados estatísticos - salários', 'salários', 'n salarios'],
                menor:      ['menor salário', 'menor', 'min'],
                p25:        ['1o quartil', '1º quartil', 'p25', 'quartil 1'],
                media:      ['média', 'media', 'avg'],
                p50:        ['mediana', 'p50', 'median'],
                p75:        ['3o quartil', '3º quartil', 'p75', 'quartil 3'],
                maior:      ['maior salário', 'maior', 'max'],
                mediaEmp:   ['média empresa', 'seu salário'],
            };
            const aliases = patterns[name] || [name];
            const idx = header.findIndex(h => aliases.some(a => h.includes(a)));
            return idx;
        };

        const C = {
            code:          col('code'),
            title:         col('title'),
            internalTitle: col('internalTitle'),
            seniority:     col('seniority'),
            nEmpresas:     col('nEmpresas'),
            nSalarios:     col('nSalarios'),
            p25:           col('p25'),
            p50:           col('p50'),
            p75:           col('p75'),
        };

        const dataRows = rows.slice(headerIdx + 1);

        // Remove benchmarks antigos (globais sem snapshot vinculado) para não misturar
        // Se tiver snapshotId, os novos benchmarks ficam marcados com a tag do snapshot
        const sourceTag = `Pesquisa ${file.name.replace(/\.(xlsx?|xls)$/i, '')} — base ${targetHours}h`;

        let imported = 0;
        let skipped = 0;
        const catalogMap = new Map<string, string>(); // "title|level" → job_catalog_id

        for (const row of dataRows) {
            const title = String(row[C.title] || '').trim();
            const seniorityRaw = String(row[C.seniority] || '').trim().toLowerCase();
            const internalTitle = C.internalTitle >= 0 ? String(row[C.internalTitle] || '').trim() : '';
            const nSal = Number(row[C.nSalarios]) || 0;

            if (!title || nSal === 0) { skipped++; continue; }

            const p25Raw = Number(row[C.p25]) || 0;
            const p50Raw = Number(row[C.p50]) || 0;
            const p75Raw = Number(row[C.p75]) || 0;

            if (p50Raw <= 0) { skipped++; continue; }

            // A pesquisa usa base 200h — normaliza para as horas alvo
            const factor = targetHours / 200;
            const p25 = Math.round(p25Raw * factor * 100) / 100;
            const p50 = Math.round(p50Raw * factor * 100) / 100;
            const p75 = Math.round(p75Raw * factor * 100) / 100;

            const level = SENIORITY_MAP[seniorityRaw] || 'ANY';
            const family = inferFamily(title);
            const grade = inferGrade(p50);
            const cboCode = String(row[C.code] || '').trim();

            const catalogKey = `${title.toLowerCase()}|${level}`;
            let catalogId = catalogMap.get(catalogKey);

            if (!catalogId) {
                // Tenta encontrar existente no banco para não duplicar
                const existing = await prisma.jobCatalog.findFirst({
                    where: {
                        title_std: { equals: title, mode: 'insensitive' },
                        level,
                    }
                });

                if (existing) {
                    catalogId = existing.id;
                } else {
                    const created = await prisma.jobCatalog.create({
                        data: {
                            family,
                            title_std: title,
                            description: internalTitle || null,
                            level,
                            grade,
                            cbo_code: cboCode || null,
                        }
                    });
                    catalogId = created.id;
                }
                catalogMap.set(catalogKey, catalogId);
            }

            // Cria benchmark — marca com snapshotId se disponível
            await prisma.marketBenchmark.create({
                data: {
                    job_catalog_id: catalogId,
                    country: 'BR',
                    p25,
                    p50,
                    p75,
                    n: nSal,
                    as_of_date: new Date('2025-10-01'),
                    source_tag: sourceTag,
                }
            });

            imported++;
        }

        return NextResponse.json({
            success: true,
            imported,
            skipped,
            sourceTag,
            message: `${imported} benchmarks importados da pesquisa "${file.name}".`,
        });

    } catch (error: any) {
        console.error('Erro ao processar pesquisa:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

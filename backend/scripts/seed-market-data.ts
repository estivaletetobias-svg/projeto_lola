/**
 * Seed: Importar Dados de Pesquisa de Mercado (Lola)
 * 
 * Lê os arquivos CSV da pasta "Tabelas pesquisa Lola" e popula as tabelas
 * job_catalog e market_benchmarks com os dados reais da pesquisa de 2025.
 * 
 * Uso: npx ts-node scripts/seed-market-data.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Fix de encoding: converte ISO-8859-1 (Latin-1) para UTF-8
function fixEncoding(str: string): string {
    return Buffer.from(str, 'binary').toString('latin1');
}

// Parseia um CSV separado por ponto e vírgula com encoding corrigido
function parseCSV(filePath: string): Record<string, string>[] {
    const rawBuffer = fs.readFileSync(filePath);
    // O arquivo está em Latin-1, fazemos a leitura correta
    const content = rawBuffer.toString('latin1');
    const lines = content.split('\n').filter(l => l.trim().length > 0);

    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));

    return lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
            row[h] = values[i] || '';
        });
        return row;
    });
}

// Converte valor monetário brasileiro para Float (ex: "3.506,12" -> 3506.12)
function parseBrazilianFloat(str: string): number {
    if (!str || str.trim() === '') return 0;
    // Remove pontos de milhar, troca vírgula decimal por ponto
    const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}

// Mapeia senioridade para o campo 'level' do schema
function mapSeniority(sen: string): string {
    const s = sen.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s.includes('indiferente') || s === '') return 'ANY';
    if (s.includes('junior') || s.includes('jr')) return 'JUNIOR';
    if (s.includes('pleno') || s.includes('mid')) return 'PLENO';
    if (s.includes('senior') || s.includes('sr')) return 'SENIOR';
    if (s.includes('estagio') || s.includes('trainee') || s.includes('estagiario')) return 'INTERN';
    if (s.includes('coordenador')) return 'COORD';
    if (s.includes('gerente') || s.includes('manager')) return 'MANAGER';
    if (s.includes('diretor')) return 'DIRECTOR';
    return s.toUpperCase().slice(0, 20);
}

// Estima um grade numérico baseado na família e senioridade
const GRADE_MAP: Record<string, number> = {
    'INTERN': 1,
    'JUNIOR': 3,
    'ANY': 5,
    'PLENO': 6,
    'SENIOR': 8,
    'COORD': 10,
    'MANAGER': 12,
    'DIRECTOR': 14,
};

async function main() {
    const tablesDir = path.join(__dirname, '../../Tabelas pesquisa Lola');
    const catalogFile = path.join(tablesDir, 'Lista de Cargos Completo.csv');
    const salariesFile = path.join(tablesDir, 'Salários por Cargo Completo.csv');

    console.log('📂 Lendo catálogo de cargos...');
    const catalogRows = parseCSV(catalogFile);
    console.log(`   → ${catalogRows.length} cargos encontrados`);

    console.log('💰 Lendo dados salariais...');
    const salaryRows = parseCSV(salariesFile);
    console.log(`   → ${salaryRows.length} registros de salário encontrados`);

    // Mapeia código -> info do catálogo para lookup rápido
    const catalogByCode = new Map<string, (typeof catalogRows)[0]>();
    for (const row of catalogRows) {
        const code = row['Código'] || row['C?digo'] || Object.values(row)[0];
        if (code) catalogByCode.set(code.trim(), row);
    }

    console.log('\n🌱 Iniciando importação para o banco de dados...');

    let createdJobs = 0;
    let createdBenchmarks = 0;
    let skippedBenchmarks = 0;

    // Mapa de código+senioridade -> JobCatalog ID (para não duplicar)
    const jobCatalogCache = new Map<string, string>();

    for (const salary of salaryRows) {
        const code = salary['Código'] || salary['C?digo'] || Object.values(salary)[0];
        const jobName = salary['Nome do Cargo'];
        const seniority = salary['Senioridade'];
        const p25 = parseBrazilianFloat(salary['1o Quartil']);
        const p50 = parseBrazilianFloat(salary['Mediana']);
        const p75 = parseBrazilianFloat(salary['3o Quartil']);
        const nSalaries = parseInt(salary['Dados Estat?sticos - Sal?rios'] || salary['Dados Estatísticos - Salários'] || '0', 10);

        if (!jobName || !code) continue;

        // Busca a descrição no catálogo pelo código
        const catalogEntry = catalogByCode.get(code.trim());
        const description = catalogEntry
            ? (catalogEntry['Miss?o do Cargo'] || catalogEntry['Missão do Cargo'] || '')
            : '';
        const similarJobs = catalogEntry
            ? (catalogEntry['Cargos Similares'] || '')
            : '';
        const cboCode = catalogEntry
            ? (catalogEntry['CBOs do Cargo'] || '')
            : '';

        const level = mapSeniority(seniority);
        const grade = GRADE_MAP[level] ?? 5;
        const cacheKey = `${code}-${level}`;

        // Evita duplicar o cargo no catálogo
        let jobCatalogId = jobCatalogCache.get(cacheKey);

        if (!jobCatalogId) {
            // Verifica se já existe no banco
            const existing = await prisma.jobCatalog.findFirst({
                where: {
                    title_std: jobName.trim(),
                    level: level,
                }
            });

            if (existing) {
                jobCatalogId = existing.id;
            } else {
                const newJob = await prisma.jobCatalog.create({
                    data: {
                        family: jobName.trim().split(' ')[0], // Primeira palavra como família
                        title_std: jobName.trim(),
                        description: description.trim().slice(0, 2000),
                        level: level,
                        grade: grade,
                        cbo_code: cboCode.trim().slice(0, 20) || null,
                    }
                });
                jobCatalogId = newJob.id;
                createdJobs++;
            }

            jobCatalogCache.set(cacheKey, jobCatalogId);
        }

        // Cria o benchmark salarial se tiver dados válidos
        if (p50 > 0) {
            try {
                await prisma.marketBenchmark.create({
                    data: {
                        job_catalog_id: jobCatalogId,
                        country: 'Brasil',
                        p25: p25,
                        p50: p50,
                        p75: p75,
                        n: isNaN(nSalaries) ? 1 : nSalaries,
                        as_of_date: new Date('2025-01-01'),
                        source_tag: 'pesquisa_lola_2025',
                    }
                });
                createdBenchmarks++;
            } catch (e: any) {
                // Ignora duplicatas ou erros de validação
                skippedBenchmarks++;
            }
        } else {
            skippedBenchmarks++;
        }
    }

    console.log('\n✅ Importação concluída!');
    console.log(`   →  Cargos criados: ${createdJobs}`);
    console.log(`   →  Benchmarks criados: ${createdBenchmarks}`);
    console.log(`   →  Registros ignorados (p50 = 0 ou duplicados): ${skippedBenchmarks}`);
}

main()
    .catch(e => {
        console.error('❌ Erro durante importação:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

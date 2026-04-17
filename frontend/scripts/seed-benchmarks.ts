/**
 * seed-benchmarks.ts
 * Importa os dados reais da pesquisa de mercado (Salários por Cargo Completo.csv)
 * para as tabelas JobCatalog e MarketBenchmark no banco de dados.
 *
 * Normalização: CSV usa base 200h → converte para 220h (padrão da empresa)
 * Execução: npx ts-node scripts/seed-benchmarks.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ── Mapa de senioridade (PT → enum) ──────────────────────────────
const SENIORITY_MAP: Record<string, string> = {
  'júnior': 'JUNIOR',
  'junior': 'JUNIOR',
  'pleno': 'PLENO',
  'sênior': 'SENIOR',
  'senior': 'SENIOR',
  'indiferente': 'ANY',
  'estagiário': 'INTERN',
  'estagiario': 'INTERN',
  'coordenador': 'COORD',
  'gerente': 'MANAGER',
  'diretor': 'DIRECTOR',
};

// ── Mapa heurístico de família por palavra-chave no título ────────
function inferFamily(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('engenheiro') || t.includes('desenvolvedor') || t.includes('programador') ||
      t.includes('frontend') || t.includes('backend') || t.includes('fullstack') ||
      t.includes('software') || t.includes('devops') || t.includes('sre') ||
      t.includes('dados') || t.includes('data') || t.includes('ml') || t.includes('ia') ||
      t.includes('inteligência artificial') || t.includes('cloud') || t.includes('rede') ||
      t.includes('infraestrutura') || t.includes('suporte') || t.includes('ti ') ||
      t.includes('sistema') || t.includes('banco de dados') || t.includes('segurança')) return 'Engineering';
  if (t.includes('product') || t.includes('produto') || t.includes('ux') ||
      t.includes('ui ') || t.includes('design') || t.includes('experiência')) return 'Design';
  if (t.includes('marketing') || t.includes('marca') || t.includes('conteúdo') ||
      t.includes('social') || t.includes('seo') || t.includes('mídia')) return 'Marketing';
  if (t.includes('comercial') || t.includes('vendas') || t.includes('venda') ||
      t.includes('account') || t.includes('pré-venda') || t.includes('pre-venda') ||
      t.includes('executivo de') || t.includes('representante')) return 'Sales';
  if (t.includes('financeiro') || t.includes('finanças') || t.includes('contábil') ||
      t.includes('contab') || t.includes('fiscal') || t.includes('controlling') ||
      t.includes('tesouraria') || t.includes('custos')) return 'Finance';
  if (t.includes('rh') || t.includes('recursos humanos') || t.includes('people') ||
      t.includes('talent') || t.includes('gente') || t.includes('treinamento') ||
      t.includes('recrutamento') || t.includes('seleção')) return 'HR';
  if (t.includes('jurídico') || t.includes('juridico') || t.includes('advogado') ||
      t.includes('compliance') || t.includes('contratos')) return 'Legal';
  if (t.includes('operações') || t.includes('logística') || t.includes('supply') ||
      t.includes('projetos') || t.includes('processos') || t.includes('qualidade')) return 'Operations';
  if (t.includes('gerente') || t.includes('diretor') || t.includes('ceo') ||
      t.includes('cto') || t.includes('cfo') || t.includes('coo') || t.includes('head')) return 'Leadership';
  return 'Admin';
}

// ── Grade heurístico: baseado na senioridade + mediana ───────────
function inferGrade(level: string, p50: number): number {
  // Base pelo percentil de mercado em 220h
  if (p50 >= 20000) return 22;
  if (p50 >= 16000) return 21;
  if (p50 >= 12000) return 20;
  if (p50 >= 10000) return 19;
  if (p50 >= 8500)  return 18;
  if (p50 >= 7000)  return 17;
  if (p50 >= 5500)  return 16;
  if (p50 >= 4500)  return 15;
  if (p50 >= 3800)  return 14;
  if (p50 >= 3200)  return 13;
  if (p50 >= 2800)  return 12;
  if (p50 >= 2400)  return 11;
  return 10;
}

// ── Normaliza valor de 200h para 220h ────────────────────────────
function normalize220(value: number, sourceHours: number = 200): number {
  return Math.round((value / sourceHours) * 220 * 100) / 100;
}

// ── Parse CSV brasileiro (separador ; e decimal ,) ───────────────
function parseBRNumber(str: string): number | null {
  if (!str || str.trim() === '' || str.trim() === '-') return null;
  const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

async function main() {
  console.log('🚀 Iniciando importação dos dados de benchmark da pesquisa...\n');

  const csvPath = path.join(
    __dirname,
    '../../Tabelas pesquisa Lola/Salários por Cargo Completo.csv'
  );

  const raw = fs.readFileSync(csvPath, { encoding: 'latin1' });
  const lines = raw.split('\n').filter(l => l.trim().length > 0);

  // Remove header
  const dataLines = lines.slice(1);

  console.log(`📄 ${dataLines.length} linhas encontradas no CSV\n`);

  // ── Limpa dados antigos ──────────────────────────────────────────
  console.log('🗑  Limpando benchmarks e catálogo antigos...');
  await prisma.marketBenchmark.deleteMany({});
  await prisma.jobMatch.deleteMany({});
  await prisma.jobCatalog.deleteMany({});
  console.log('   ✓ Banco limpo\n');

  let importedCatalog = 0;
  let importedBenchmarks = 0;
  let skipped = 0;

  // Mapa para evitar duplicatas no JobCatalog: "titulo|level" → id
  const catalogMap = new Map<string, string>();

  for (const line of dataLines) {
    // Colunas: Código;Nome;Senioridade;Região;Segmento;Data;Horas;N_emp;N_sal;Menor;P25;Média;P50;P75;Maior
    const cols = line.replace(/\r/g, '').split(';');
    if (cols.length < 15) { skipped++; continue; }

    const [
      cboCode, titleRaw, seniorityRaw, region, segment, dateStr,
      hoursRaw, nEmpStr, nSalStr,
      _menor, p25Str, _media, p50Str, p75Str, _maior
    ] = cols;

    const title = titleRaw.trim();
    if (!title) { skipped++; continue; }

    const seniorityKey = seniorityRaw.trim().toLowerCase();
    const level = SENIORITY_MAP[seniorityKey] || 'ANY';
    const sourceHours = parseInt(hoursRaw) || 200;

    const p25Raw = parseBRNumber(p25Str);
    const p50Raw = parseBRNumber(p50Str);
    const p75Raw = parseBRNumber(p75Str);
    const nSal = parseInt(nSalStr) || 0;

    if (!p25Raw || !p50Raw || !p75Raw || p50Raw <= 0) { skipped++; continue; }

    // Normaliza para 220h
    const p25 = normalize220(p25Raw, sourceHours);
    const p50 = normalize220(p50Raw, sourceHours);
    const p75 = normalize220(p75Raw, sourceHours);

    const family = inferFamily(title);
    const grade = inferGrade(level, p50);
    const catalogKey = `${title.toLowerCase()}|${level}`;

    // ── Upsert JobCatalog ──────────────────────────────────────────
    let catalogId = catalogMap.get(catalogKey);
    if (!catalogId) {
      const catalog = await prisma.jobCatalog.create({
        data: {
          family,
          title_std: title,
          level,
          grade,
          cbo_code: cboCode.trim() || null,
        }
      });
      catalogId = catalog.id;
      catalogMap.set(catalogKey, catalogId);
      importedCatalog++;
    }

    // ── Cria MarketBenchmark ───────────────────────────────────────
    const year = parseInt(dateStr) || 2025;
    await prisma.marketBenchmark.create({
      data: {
        job_catalog_id: catalogId,
        state: region.trim() === 'Nacional' ? null : region.trim(),
        country: 'BR',
        p25,
        p50,
        p75,
        n: nSal,
        as_of_date: new Date(`${year}-01-01`),
        source_tag: 'Pesquisa Salarial TI-Software 2025 (base 220h)',
      }
    });
    importedBenchmarks++;

    if (importedBenchmarks % 200 === 0) {
      process.stdout.write(`   ↳ ${importedBenchmarks} benchmarks importados...\r`);
    }
  }

  console.log(`\n\n✅ Importação concluída!`);
  console.log(`   • ${importedCatalog} cargos no JobCatalog`);
  console.log(`   • ${importedBenchmarks} benchmarks no MarketBenchmark`);
  console.log(`   • ${skipped} linhas ignoradas (dados incompletos)\n`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Erro durante a importação:', e);
  prisma.$disconnect();
  process.exit(1);
});

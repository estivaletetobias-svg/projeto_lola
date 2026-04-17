/**
 * seed-benchmarks.mjs
 * Script de importação dos dados reais da pesquisa salarial.
 * Execução: node scripts/seed-benchmarks.mjs
 */

import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

// ── Mapa senioridade ────────────────────────────────────────────
const SENIORITY_MAP = {
  'júnior': 'JUNIOR', 'junior': 'JUNIOR',
  'pleno': 'PLENO',
  'sênior': 'SENIOR', 'senior': 'SENIOR',
  'indiferente': 'ANY',
  'estagiário': 'INTERN', 'estagiario': 'INTERN',
  'coordenador': 'COORD',
  'gerente': 'MANAGER',
  'diretor': 'DIRECTOR',
};

function inferFamily(title) {
  const t = title.toLowerCase();
  if (/engenheiro|desenvolvedor|programador|frontend|backend|fullstack|software|devops|sre|cloud|rede|infraestrutura|suporte t|sistema|banco de dados|segurança da info/.test(t)) return 'Engineering';
  if (/cienti|dados|data science|machine learn|intelig.*artif|bi |business int/.test(t)) return 'Data';
  if (/product|produto|ux|design|experiência do/.test(t)) return 'Design';
  if (/marketing|marca|conteúdo|social media|seo|mídia/.test(t)) return 'Marketing';
  if (/comercial|vendas|venda|account|pré.venda|executivo de conta|representante/.test(t)) return 'Sales';
  if (/financeiro|finanças|contábil|contab|fiscal|controlling|tesour|custos/.test(t)) return 'Finance';
  if (/ rh|recursos humanos|people|talent|gente|treinamento|recrut|seleção/.test(t)) return 'HR';
  if (/jurídic|advogado|compli|contrato/.test(t)) return 'Legal';
  if (/operações|logística|supply|projetos|processos|qualidade/.test(t)) return 'Operations';
  if (/gerente|diretor|ceo|cto|cfo|coo|head of/.test(t)) return 'Leadership';
  return 'Admin';
}

function inferGrade(p50) {
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

function parseBR(str) {
  if (!str || str.trim() === '' || str.trim() === '-') return null;
  const n = parseFloat(str.trim().replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? null : n;
}

function to220(val, sourceHours = 200) {
  return Math.round((val / sourceHours) * 220 * 100) / 100;
}

async function main() {
  console.log('🚀 Importando dados reais da pesquisa salarial...\n');

  const csvPath = join(__dirname, '../../Tabelas pesquisa Lola/Salários por Cargo Completo.csv');

  // Lê o CSV linha por linha
  const lines = [];
  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: 'latin1' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lines.push(line);
  }

  const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
  console.log(`📄 ${dataLines.length} linhas encontradas no CSV\n`);

  // ── Limpa dados antigos ─────────────────────────────────────
  console.log('🗑  Limpando dados antigos...');
  await prisma.marketBenchmark.deleteMany({});
  await prisma.jobMatch.deleteMany({});
  await prisma.jobCatalog.deleteMany({});
  console.log('   ✓ Banco limpo\n');

  let importedCatalog = 0;
  let importedBenchmarks = 0;
  let skipped = 0;

  const catalogMap = new Map(); // "titulo|level" → id

  for (const line of dataLines) {
    const cols = line.replace(/\r/g, '').split(';');
    if (cols.length < 15) { skipped++; continue; }

    const [
      cboCode, titleRaw, seniorityRaw, region, , dateStr,
      hoursRaw, , nSalStr,
      , p25Str, , p50Str, p75Str,
    ] = cols;

    const title = titleRaw?.trim() || '';
    if (!title) { skipped++; continue; }

    const seniorityKey = (seniorityRaw || '').trim().toLowerCase();
    const level = SENIORITY_MAP[seniorityKey] || 'ANY';
    const sourceHours = parseInt(hoursRaw) || 200;

    const p25Raw = parseBR(p25Str);
    const p50Raw = parseBR(p50Str);
    const p75Raw = parseBR(p75Str);
    if (!p25Raw || !p50Raw || !p75Raw || p50Raw <= 0) { skipped++; continue; }

    // Normaliza para 220h
    const p25 = to220(p25Raw, sourceHours);
    const p50 = to220(p50Raw, sourceHours);
    const p75 = to220(p75Raw, sourceHours);
    const nSal = parseInt(nSalStr) || 0;

    const family = inferFamily(title);
    const grade = inferGrade(p50);
    const catalogKey = `${title.toLowerCase()}|${level}`;

    // Upsert JobCatalog
    let catalogId = catalogMap.get(catalogKey);
    if (!catalogId) {
      const catalog = await prisma.jobCatalog.create({
        data: {
          family,
          title_std: title,
          level,
          grade,
          cbo_code: cboCode?.trim() || null,
        }
      });
      catalogId = catalog.id;
      catalogMap.set(catalogKey, catalogId);
      importedCatalog++;
    }

    // Cria MarketBenchmark
    const year = parseInt(dateStr) || 2025;
    await prisma.marketBenchmark.create({
      data: {
        job_catalog_id: catalogId,
        state: (region?.trim() === 'Nacional' || !region?.trim()) ? null : region.trim(),
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

    if (importedBenchmarks % 250 === 0) {
      process.stdout.write(`   ↳ ${importedBenchmarks}/${dataLines.length} importados...\r`);
    }
  }

  console.log(`\n\n✅ Importação concluída com sucesso!`);
  console.log(`   • ${importedCatalog} cargos adicionados ao JobCatalog`);
  console.log(`   • ${importedBenchmarks} benchmarks adicionados ao MarketBenchmark`);
  console.log(`   • ${skipped} linhas ignoradas (dados incompletos)\n`);
  console.log(`📊 Base: Pesquisa Salarial TI-Software 2025, normalizada para 220h\n`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('\n❌ Erro:', e.message);
  prisma.$disconnect();
  process.exit(1);
});

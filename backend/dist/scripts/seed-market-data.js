"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
function fixEncoding(str) {
    return Buffer.from(str, 'binary').toString('latin1');
}
function parseCSV(filePath) {
    const rawBuffer = fs.readFileSync(filePath);
    const content = rawBuffer.toString('latin1');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
        const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, i) => {
            row[h] = values[i] || '';
        });
        return row;
    });
}
function parseBrazilianFloat(str) {
    if (!str || str.trim() === '')
        return 0;
    const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
}
function mapSeniority(sen) {
    const s = sen.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s.includes('indiferente') || s === '')
        return 'ANY';
    if (s.includes('junior') || s.includes('jr'))
        return 'JUNIOR';
    if (s.includes('pleno') || s.includes('mid'))
        return 'PLENO';
    if (s.includes('senior') || s.includes('sr'))
        return 'SENIOR';
    if (s.includes('estagio') || s.includes('trainee') || s.includes('estagiario'))
        return 'INTERN';
    if (s.includes('coordenador'))
        return 'COORD';
    if (s.includes('gerente') || s.includes('manager'))
        return 'MANAGER';
    if (s.includes('diretor'))
        return 'DIRECTOR';
    return s.toUpperCase().slice(0, 20);
}
const GRADE_MAP = {
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
    const catalogByCode = new Map();
    for (const row of catalogRows) {
        const code = row['Código'] || row['C?digo'] || Object.values(row)[0];
        if (code)
            catalogByCode.set(code.trim(), row);
    }
    console.log('\n🌱 Iniciando importação para o banco de dados...');
    let createdJobs = 0;
    let createdBenchmarks = 0;
    let skippedBenchmarks = 0;
    const jobCatalogCache = new Map();
    for (const salary of salaryRows) {
        const code = salary['Código'] || salary['C?digo'] || Object.values(salary)[0];
        const jobName = salary['Nome do Cargo'];
        const seniority = salary['Senioridade'];
        const p25 = parseBrazilianFloat(salary['1o Quartil']);
        const p50 = parseBrazilianFloat(salary['Mediana']);
        const p75 = parseBrazilianFloat(salary['3o Quartil']);
        const nSalaries = parseInt(salary['Dados Estat?sticos - Sal?rios'] || salary['Dados Estatísticos - Salários'] || '0', 10);
        if (!jobName || !code)
            continue;
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
        let jobCatalogId = jobCatalogCache.get(cacheKey);
        if (!jobCatalogId) {
            const existing = await prisma.jobCatalog.findFirst({
                where: {
                    title_std: jobName.trim(),
                    level: level,
                }
            });
            if (existing) {
                jobCatalogId = existing.id;
            }
            else {
                const newJob = await prisma.jobCatalog.create({
                    data: {
                        family: jobName.trim().split(' ')[0],
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
            }
            catch (e) {
                skippedBenchmarks++;
            }
        }
        else {
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
//# sourceMappingURL=seed-market-data.js.map
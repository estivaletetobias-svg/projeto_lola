"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Iniciando limpeza e carga do Catálogo Mestre Lola (Construção Civil)...');
    await prisma.marketBenchmark.deleteMany({});
    await prisma.jobMatch.deleteMany({});
    await prisma.jobCatalog.deleteMany({});
    const constructionJobs = [
        { family: 'Obras', title_std: 'Servente', level: 'Junior', grade: 2, cbo_code: '717020', description: 'Executa tarefas manuais simples.' },
        { family: 'Obras', title_std: 'Pedreiro', level: 'Pleno', grade: 6, cbo_code: '715210', description: 'Executa serviços de fundação e alvenaria.' },
        { family: 'Engenharia', title_std: 'Engenheiro Civil', level: 'Pleno', grade: 18, cbo_code: '214205', description: 'Gestor técnico de obra.' },
        { family: 'Engenharia', title_std: 'Mestre de Obras', level: 'Senior', grade: 12, cbo_code: '710205', description: 'Coordenação de equipes.' },
        { family: 'Tecnologia', title_std: 'Software Engineer', level: 'Junior', grade: 12, cbo_code: '212405', description: 'Desenvolvimento de sistemas escaláveis e APIs.' },
        { family: 'Tecnologia', title_std: 'Software Engineer', level: 'Pleno', grade: 18, cbo_code: '212405', description: 'Arquitetura de software e mentoria técnica.' },
        { family: 'Tecnologia', title_std: 'Software Engineer', level: 'Senior', grade: 24, cbo_code: '212405', description: 'Liderança técnica de squads e decisões de infraestrutura.' },
        { family: 'Produto', title_std: 'Product Manager', level: 'Pleno', grade: 20, cbo_code: '142105', description: 'Gestão de roadmap e descoberta de produto.' },
        { family: 'Tecnologia', title_std: 'Data Scientist', level: 'Senior', grade: 26, cbo_code: '211105', description: 'Modelagem preditiva e inteligência de dados.' },
        { family: 'Executivo', title_std: 'CTO', level: 'Executive', grade: 45, cbo_code: '121010', description: 'Visão tecnológica estratégica e gestão de engenharia.' },
        { family: 'Vendas', title_std: 'Account Executive', level: 'Senior', grade: 22, cbo_code: '354120', description: 'Negociações B2B de alto valor.' }
    ];
    for (const job of constructionJobs) {
        await prisma.jobCatalog.create({ data: job });
    }
    const catalog = await prisma.jobCatalog.findMany();
    for (const item of catalog) {
        const base = (item.grade * 800) + 1000;
        await prisma.marketBenchmark.create({
            data: {
                job_catalog_id: item.id,
                p25: base * 0.85,
                p50: base,
                p75: base * 1.25,
                n: 50 + Math.floor(Math.random() * 200),
                as_of_date: new Date(),
                state: 'SP',
                country: 'Brazil',
            },
        });
    }
    const tenantId = 'demo-tenant-id';
    await prisma.tenant.upsert({
        where: { id: tenantId },
        update: { name: 'Construtora Exemplo S.A.' },
        create: {
            id: tenantId,
            name: 'Construtora Exemplo S.A.',
            cnpj: '00.000.000/0001-00',
            city: 'São Paulo',
            state: 'SP',
            country: 'Brazil',
        },
    });
    await prisma.user.upsert({
        where: { email: 'contato@lola.ai' },
        update: { role: 'OWNER' },
        create: {
            tenant_id: tenantId,
            email: 'contato@lola.ai',
            role: 'OWNER',
        },
    });
    console.log('✅ Catálogo Mestre da Lola (Construção Civil) carregado com sucesso!');
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando limpeza e carga do Catálogo Mestre Lola (Construção Civil)...');

    // 1. Limpar dados para garantir consistência
    await prisma.marketBenchmark.deleteMany({});
    await prisma.jobMatch.deleteMany({});
    await prisma.jobCatalog.deleteMany({});

    // 2. Criar Catálogo de Construção Civil (O "Arquivo Mestre")
    const constructionJobs = [
        {
            family: 'Obras', title_std: 'Servente', level: 'Junior', grade: 2, cbo_code: '717020',
            description: 'Executa tarefas manuais simples, auxilia pedreiros e eletricistas no canteiro de obras.'
        },
        {
            family: 'Obras', title_std: 'Pedreiro de Alvenaria', level: 'Pleno', grade: 5, cbo_code: '715210',
            description: 'Executa serviços de fundação, alvenaria de vedação e estrutural segundo projetos.'
        },
        {
            family: 'Obras', title_std: 'Azulejista / Revestidor', level: 'Pleno', grade: 6, cbo_code: '715210',
            description: 'Especialista em acabamentos finos, colocação de cerâmicas, porcelanatos e pedras.'
        },
        {
            family: 'Obras', title_std: 'Mestre de Obras', level: 'Senior', grade: 12, cbo_code: '710205',
            description: 'Responsável direto pela execução física da obra, coordenação de equipes e cumprimento de cronogramas.'
        },
        {
            family: 'Engenharia', title_std: 'Engenheiro Civil Junior', level: 'Junior', grade: 14, cbo_code: '214205',
            description: 'Acompanha a execução técnica, faz medições e garante o cumprimento das normas de segurança.'
        },
        {
            family: 'Engenharia', title_std: 'Engenheiro Civil Pleno', level: 'Pleno', grade: 18, cbo_code: '214205',
            description: 'Gestor técnico de obra, responsável por custos, prazos e compatibilização de projetos.'
        },
        {
            family: 'Engenharia', title_std: 'Engenheiro de Segurança', level: 'Pleno', grade: 16, cbo_code: '214915',
            description: 'Garante o cumprimento das NRs, treinamento de equipes e prevenção de acidentes de trabalho.'
        },
        {
            family: 'Suprimentos', title_std: 'Analista de Suprimentos', level: 'Pleno', grade: 10, cbo_code: '354205',
            description: 'Gestão de compras de insumos para construção, cotações e negociações com fornecedores de grande porte.'
        },
        {
            family: 'Financeiro', title_std: 'Assistente Administrativo de Obras', level: 'Junior', grade: 6, cbo_code: '411010',
            description: 'Focado em rotinas de canteiro: RH local, controle de ponto e documentação de integração.'
        },
        {
            family: 'Gestão', title_std: 'Gerente de Planejamento', level: 'Senior', grade: 24, cbo_code: '142105',
            description: 'Gestão estratégica de múltiplos canteiros, controle orçamentário e interfaces executivas.'
        }
    ];

    for (const job of constructionJobs) {
        await prisma.jobCatalog.create({ data: job });
    }

    // 3. Criar Benchmarks de Mercado (Simulação SP)
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

    // 4. Criar Tenant e Usuário de Teste (usando IDs consistentes mas evitando conflitos)
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

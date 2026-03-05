import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Create Job Catalog
    const jobs = [
        { family: 'Technology', title_std: 'Software Engineer I', level: 'Junior', cbo_code: '212405' },
        { family: 'Technology', title_std: 'Software Engineer II', level: 'Pleno', cbo_code: '212405' },
        { family: 'Technology', title_std: 'Software Engineer III', level: 'Senior', cbo_code: '212405' },
        { family: 'Technology', title_std: 'Product Manager', level: 'Senior', cbo_code: '212405' },
        { family: 'Product', title_std: 'Product Designer', level: 'Pleno', cbo_code: '262410' },
        { family: 'Sales', title_std: 'Account Executive', level: 'Pleno', cbo_code: '252305' },
        { family: 'Finance', title_std: 'Financial Analyst', level: 'Pleno', cbo_code: '252205' },
    ];

    for (const job of jobs) {
        await prisma.jobCatalog.upsert({
            where: { id: job.title_std + job.level }, // Use a unique way or just create
            update: {},
            create: job,
        });
    }

    // 2. Create Market Benchmarks
    const catalog = await prisma.jobCatalog.findMany();
    for (const item of catalog) {
        await prisma.marketBenchmark.create({
            data: {
                job_catalog_id: item.id,
                p25: 5000 + Math.random() * 2000,
                p50: 8000 + Math.random() * 3000,
                p75: 12000 + Math.random() * 4000,
                n: 10 + Math.floor(Math.random() * 50),
                as_of_date: new Date(),
                country: 'Brazil',
            },
        });
    }

    // 3. Create Demo Tenant
    const tenant = await prisma.tenant.upsert({
        where: { id: 'demo-tenant-id' },
        update: {},
        create: {
            id: 'demo-tenant-id',
            name: 'Lola Tech Ltd',
            cnpj: '12.345.678/0001-99',
            cnae: '6201-5/01',
            company_size: '51-200',
            city: 'São Paulo',
            state: 'SP',
            country: 'Brazil',
            currency: 'BRL',
        },
    });

    // 4. Create Demo User
    await prisma.user.upsert({
        where: { email: 'admin@lola.ai' },
        update: {},
        create: {
            id: 'demo-user-id',
            tenant_id: tenant.id,
            email: 'admin@lola.ai',
            role: 'OWNER',
        },
    });

    console.log('Seed completed successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

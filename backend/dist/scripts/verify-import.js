"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
async function verifyImport() {
    const prisma = new client_1.PrismaClient();
    try {
        console.log('--- Verificando Snapshots ---');
        const snapshots = await prisma.payrollSnapshot.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });
        console.table(snapshots.map(s => ({
            id: s.id,
            status: s.status,
            period: s.period_date,
            created: s.created_at
        })));
        if (snapshots.length > 0) {
            const lastId = snapshots[0].id;
            console.log(`\n--- Dados do ÚLTIMO Snapshot (${lastId}) ---`);
            const count = await prisma.compensation.count({ where: { snapshot_id: lastId } });
            console.log(`Total de registros de salário (Compensations): ${count}`);
            const samples = await prisma.compensation.findMany({
                where: { snapshot_id: lastId },
                include: { employee: true },
                take: 5
            });
            console.log('Amostra de dados (REAIS da Lumis):');
            console.table(samples.map(c => ({
                cargo: 'Cargo Detectado',
                salario: c.total_cash,
                area: c.employee.area,
                key: c.employee.employee_key
            })));
            const salaryStructures = await prisma.salaryStructure.count({
                where: { snapshot_id: lastId }
            });
            console.log(`Estruturas salariais calculadas: ${salaryStructures}`);
        }
        else {
            console.log('Nenhum dado encontrado no banco ainda.');
        }
    }
    catch (e) {
        console.error('Erro na verificação:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
verifyImport();
//# sourceMappingURL=verify-import.js.map
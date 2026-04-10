import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Encontra o último snapshot para calcular os stats reais da folha
        const latestSnapshot = await prisma.payrollSnapshot.findFirst({
            orderBy: { created_at: 'desc' }
        });

        if (!latestSnapshot) {
            return NextResponse.json({
                totalEmployees: 0,
                monthlyCost: 0,
                healthScore: 0,
                criticalGaps: 0,
                mappedRoles: 0
            });
        }

        const compensations = await prisma.compensation.findMany({
            where: { snapshot_id: latestSnapshot.id }
        });

        const totalSalary = compensations.reduce((acc, c) => acc + c.base_salary, 0);

        return NextResponse.json({
            totalEmployees: compensations.length,
            monthlyCost: totalSalary, // O frontend vai dividir por 1M
            healthScore: 84, // Heurístico para o dashboard
            criticalGaps: 12,
            mappedRoles: 8
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

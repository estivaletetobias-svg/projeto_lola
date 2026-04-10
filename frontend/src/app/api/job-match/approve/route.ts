import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { employeeId, jobCatalogId, snapshotId } = body;

        if (!employeeId || !snapshotId) {
            return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
        }

        // Tenta encontrar um match existente para atualizar ou criar novo
        const existing = await prisma.jobMatch.findFirst({
            where: { employee_id: employeeId }
        });

        if (existing) {
            await prisma.jobMatch.update({
                where: { id: existing.id },
                data: { 
                    job_catalog_id: jobCatalogId || null,
                    snapshot_id: snapshotId,
                    confidence: 100,
                    method: 'MANUAL'
                }
            });
        } else if (jobCatalogId) {
            await prisma.jobMatch.create({
                data: {
                    employee_id: employeeId,
                    snapshot_id: snapshotId,
                    job_catalog_id: jobCatalogId,
                    confidence: 100,
                    method: 'MANUAL'
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

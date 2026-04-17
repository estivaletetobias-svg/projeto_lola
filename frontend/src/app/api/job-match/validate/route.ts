import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/job-match/validate
 * Valida (ou atualiza) o match de um colaborador individual.
 * Body: { employeeId, snapshotId, jobCatalogId, description? }
 */
export async function POST(req: Request) {
    try {
        const { employeeId, snapshotId, jobCatalogId, description } = await req.json();

        if (!employeeId || !snapshotId || !jobCatalogId) {
            return NextResponse.json({ error: 'employeeId, snapshotId e jobCatalogId são obrigatórios.' }, { status: 400 });
        }

        // Upsert do JobMatch
        const existing = await prisma.jobMatch.findFirst({
            where: { employee_id: employeeId }
        });

        if (existing) {
            await prisma.jobMatch.update({
                where: { id: existing.id },
                data: {
                    job_catalog_id: jobCatalogId,
                    snapshot_id: snapshotId,
                    confidence: 100,
                    method: 'MANUAL',
                    reviewed_at: new Date(),
                }
            });
        } else {
            await prisma.jobMatch.create({
                data: {
                    employee_id: employeeId,
                    snapshot_id: snapshotId,
                    job_catalog_id: jobCatalogId,
                    confidence: 100,
                    method: 'MANUAL',
                    reviewed_at: new Date(),
                }
            });
        }

        // Atualiza a descrição no catálogo se fornecida
        if (description !== undefined) {
            await prisma.jobCatalog.update({
                where: { id: jobCatalogId },
                data: { description }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/job-match/validate
 * Remove a validação de um colaborador (volta para "pendente").
 * Body: { employeeId }
 */
export async function DELETE(req: Request) {
    try {
        const { employeeId } = await req.json();
        if (!employeeId) return NextResponse.json({ error: 'employeeId obrigatório.' }, { status: 400 });

        await prisma.jobMatch.deleteMany({ where: { employee_id: employeeId } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobMatchService {
    constructor(private prisma: PrismaService) { }

    async getMatchesForSnapshot(snapshotId: string) {
        // Encontra empregados no snapshot e seus matches atuais (se houver)
        const employees = await this.prisma.employee.findMany({
            where: {
                compensation: {
                    some: { snapshot_id: snapshotId }
                }
            },
            include: {
                job_matches: {
                    where: { snapshot_id: snapshotId },
                    include: { job_catalog: true }
                }
            }
        });

        // Retorna um formato fácil para o frontend
        return employees.map(emp => ({
            employeeId: emp.id,
            employeeName: emp.full_name,
            internalTitle: emp.area || 'Geral',
            match: emp.job_matches[0] || null
        }));
    }

    async upsertMatch(data: { employeeId: string, snapshotId: string, jobCatalogId: string, method?: string }) {
        const { employeeId, snapshotId, jobCatalogId, method } = data;

        // Tenta encontrar um match existente
        const existing = await this.prisma.jobMatch.findFirst({
            where: { employee_id: employeeId, snapshot_id: snapshotId }
        });

        // Se o catalogId for vazio ou nulo, queremos REMOVER o mapeamento (excluir da análise)
        if (!jobCatalogId || jobCatalogId === '') {
            if (existing) {
                return this.prisma.jobMatch.delete({
                    where: { id: existing.id }
                });
            }
            return null; // Nada para deletar
        }

        if (existing) {
            return this.prisma.jobMatch.update({
                where: { id: existing.id },
                data: { job_catalog_id: jobCatalogId, method: method || 'MANUAL' }
            });
        } else {
            return this.prisma.jobMatch.create({
                data: {
                    employee_id: employeeId,
                    snapshot_id: snapshotId,
                    job_catalog_id: jobCatalogId,
                    confidence: 1.0,
                    method: method || 'MANUAL'
                }
            });
        }
    }

    async autoMatch(snapshotId: string) {
        // ... (existing autoMatch logic if needed, but we prefer manual/semi-auto check for now)
        return 0;
    }
}


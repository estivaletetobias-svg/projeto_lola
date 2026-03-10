import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobMatchService {
    constructor(private prisma: PrismaService) { }

    async getMatchesForSnapshot(snapshotId: string) {
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

        return employees.map(emp => ({
            employeeId: emp.id,
            employeeName: emp.full_name,
            internalTitle: emp.area || 'Geral',
            match: emp.job_matches[0] || null
        }));
    }

    async upsertMatch(data: { employeeId: string, snapshotId: string, jobCatalogId: string, method?: string }) {
        const { employeeId, snapshotId, jobCatalogId, method } = data;

        const existing = await this.prisma.jobMatch.findFirst({
            where: { employee_id: employeeId, snapshot_id: snapshotId }
        });

        if (!jobCatalogId || jobCatalogId === '') {
            if (existing) {
                return this.prisma.jobMatch.delete({ where: { id: existing.id } });
            }
            return null;
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

    /**
     * Calcula score de similaridade entre dois textos usando sobreposição de palavras.
     * Ignora acnetos, case e palavras irrelevantes.
     */
    private similarity(a: string, b: string): number {
        const normalize = (s: string) =>
            s.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(w => w.length > 2 && !['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'e', 'ou', 'para', 'com'].includes(w));

        const wordsA = new Set(normalize(a));
        const wordsB = new Set(normalize(b));
        if (wordsA.size === 0 || wordsB.size === 0) return 0;

        let matches = 0;
        for (const w of wordsA) {
            if (wordsB.has(w)) matches++;
            // Partial match: verifica se alguma palavra de B começa com palavra de A
            else for (const wb of wordsB) {
                if (wb.startsWith(w) || w.startsWith(wb)) { matches += 0.5; break; }
            }
        }

        // Jaccard-like score
        const union = new Set([...wordsA, ...wordsB]).size;
        return matches / union;
    }

    /**
     * Para cada cargo interno único da folha, sugere os top-3 cargos do catálogo.
     */
    async suggestMatches(snapshotId: string) {
        const employees = await this.prisma.employee.findMany({
            where: { compensation: { some: { snapshot_id: snapshotId } } },
            include: {
                job_matches: {
                    where: { snapshot_id: snapshotId },
                    include: { job_catalog: true }
                }
            }
        });

        const catalog = await this.prisma.jobCatalog.findMany({
            select: { id: true, title_std: true, level: true, family: true, grade: true }
        });

        // Processa por cargo único (agrupa colaboradores com mesmo cargo)
        const uniqueTitles = new Map<string, string[]>(); // título -> [employeeIds]
        for (const emp of employees) {
            const title = emp.area || 'Geral';
            if (!uniqueTitles.has(title)) uniqueTitles.set(title, []);
            uniqueTitles.get(title)!.push(emp.id);
        }

        const suggestions: any[] = [];

        for (const [internalTitle, employeeIds] of uniqueTitles) {
            // Calcula score para cada cargo do catálogo
            const scored = catalog.map(job => ({
                ...job,
                score: this.similarity(internalTitle, job.title_std)
            })).filter(j => j.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            // Verifica se já tem match aprovado
            const sampleEmp = employees.find(e => e.id === employeeIds[0]);
            const existingMatch = sampleEmp?.job_matches[0] || null;

            suggestions.push({
                internalTitle,
                employeeIds,
                count: employeeIds.length,
                existingMatch: existingMatch ? {
                    id: existingMatch.id,
                    jobCatalogId: existingMatch.job_catalog_id,
                    jobTitle: existingMatch.job_catalog.title_std,
                    method: existingMatch.method,
                    confidence: existingMatch.confidence
                } : null,
                suggestions: scored.map(s => ({
                    jobCatalogId: s.id,
                    jobTitle: s.title_std,
                    level: s.level,
                    grade: s.grade,
                    confidence: Math.round(s.score * 100)
                }))
            });
        }

        return suggestions.sort((a, b) => {
            // Pendentes primeiro
            const aPending = !a.existingMatch ? 1 : 0;
            const bPending = !b.existingMatch ? 1 : 0;
            return bPending - aPending;
        });
    }

    /**
     * Aprova em lote: aplica a sugestão #0 (melhor match) para todos 
     * os cargos que ainda não foram mapeados.
     */
    async autoApproveAll(snapshotId: string) {
        const suggestions = await this.suggestMatches(snapshotId);
        let approved = 0;

        for (const group of suggestions) {
            if (group.existingMatch || group.suggestions.length === 0) continue;
            const bestMatch = group.suggestions[0];
            if (bestMatch.confidence < 30) continue; // só aprova se tiver > 30% de confiança

            for (const empId of group.employeeIds) {
                await this.upsertMatch({
                    employeeId: empId,
                    snapshotId,
                    jobCatalogId: bestMatch.jobCatalogId,
                    method: 'AUTO_SUGGEST'
                });
            }
            approved++;
        }

        return { approved, total: suggestions.length };
    }

    async autoMatch(snapshotId: string) {
        return this.autoApproveAll(snapshotId);
    }
}

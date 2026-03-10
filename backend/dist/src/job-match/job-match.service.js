"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobMatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let JobMatchService = class JobMatchService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMatchesForSnapshot(snapshotId) {
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
    async upsertMatch(data) {
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
        }
        else {
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
    similarity(a, b) {
        const normalize = (s) => s.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2 && !['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'e', 'ou', 'para', 'com'].includes(w));
        const wordsA = new Set(normalize(a));
        const wordsB = new Set(normalize(b));
        if (wordsA.size === 0 || wordsB.size === 0)
            return 0;
        let matches = 0;
        for (const w of wordsA) {
            if (wordsB.has(w))
                matches++;
            else
                for (const wb of wordsB) {
                    if (wb.startsWith(w) || w.startsWith(wb)) {
                        matches += 0.5;
                        break;
                    }
                }
        }
        const union = new Set([...wordsA, ...wordsB]).size;
        return matches / union;
    }
    async suggestMatches(snapshotId) {
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
        const uniqueTitles = new Map();
        for (const emp of employees) {
            const title = emp.area || 'Geral';
            if (!uniqueTitles.has(title))
                uniqueTitles.set(title, []);
            uniqueTitles.get(title).push(emp.id);
        }
        const suggestions = [];
        for (const [internalTitle, employeeIds] of uniqueTitles) {
            const scored = catalog.map(job => ({
                ...job,
                score: this.similarity(internalTitle, job.title_std)
            })).filter(j => j.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);
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
            const aPending = !a.existingMatch ? 1 : 0;
            const bPending = !b.existingMatch ? 1 : 0;
            return bPending - aPending;
        });
    }
    async autoApproveAll(snapshotId) {
        const suggestions = await this.suggestMatches(snapshotId);
        let approved = 0;
        for (const group of suggestions) {
            if (group.existingMatch || group.suggestions.length === 0)
                continue;
            const bestMatch = group.suggestions[0];
            if (bestMatch.confidence < 30)
                continue;
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
    async autoMatch(snapshotId) {
        return this.autoApproveAll(snapshotId);
    }
};
exports.JobMatchService = JobMatchService;
exports.JobMatchService = JobMatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobMatchService);
//# sourceMappingURL=job-match.service.js.map
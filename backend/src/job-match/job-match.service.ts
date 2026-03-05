import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobMatchService {
    constructor(private prisma: PrismaService) { }

    async autoMatch(snapshotId: string) {
        const compensations = await this.prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: { employee: true },
        });

        const catalog = await this.prisma.jobCatalog.findMany();

        const matches = [];

        for (const comp of compensations) {
            const employeeTitle = comp.employee.area; // Simple for MVP; ideally has "current_title"

            // Simple string matching
            const bestMatch = catalog.find(cat =>
                employeeTitle.toLowerCase().includes(cat.title_std.toLowerCase()) ||
                cat.title_std.toLowerCase().includes(employeeTitle.toLowerCase())
            );

            if (bestMatch) {
                matches.push({
                    employee_id: comp.employee_id,
                    snapshot_id: snapshotId,
                    job_catalog_id: bestMatch.id,
                    confidence: 0.8,
                    method: 'REGEX',
                });
            }
        }

        if (matches.length > 0) {
            await this.prisma.jobMatch.createMany({
                data: matches,
            });
        }

        return matches.length;
    }
}

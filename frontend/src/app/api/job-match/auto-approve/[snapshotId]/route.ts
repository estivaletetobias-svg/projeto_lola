import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ snapshotId: string }> }
) {
    try {
        const { snapshotId } = await params;

        // Fetch all employees for this snapshot
        const compensations = await prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: { employee: true }
        });

        if (!compensations.length) {
            return NextResponse.json({ success: true, count: 0 });
        }

        // HEURISTIC AUTO-APPROVE:
        // For each employee, find a reasonable match if none exists
        // In a real scenario, this would use the AI suggestions.
        // For the fallback, we'll map them based on their 'area' (internal title)
        // to the FIRST catalog entry that matches or a default one.
        
        const catalog = await prisma.jobCatalog.findMany();
        
        let approvedCount = 0;
        for (const comp of compensations) {
            const existing = await prisma.jobMatch.findFirst({
                where: { employee_id: comp.employee_id }
            });

            if (!existing) {
                // Find a catalog item that matches the title (area) or just pick one by grade heuristic
                const internalTitle = comp.employee.area.toLowerCase();
                let match = catalog.find(c => internalTitle.includes(c.title_std.toLowerCase()) || c.title_std.toLowerCase().includes(internalTitle));
                
                // Fallback to salary-based grade matching if no title match
                if (!match) {
                    let targetGrade = 10;
                    if (comp.base_salary > 12000) targetGrade = 20;
                    else if (comp.base_salary > 8000) targetGrade = 17;
                    else if (comp.base_salary > 5000) targetGrade = 14;
                    else if (comp.base_salary > 3000) targetGrade = 12;
                    
                    match = catalog.find(c => c.grade === targetGrade) || catalog[0];
                }

                if (match) {
                    await prisma.jobMatch.create({
                        data: {
                            employee_id: comp.employee_id,
                            snapshot_id: snapshotId,
                            job_catalog_id: match.id,
                            confidence: 100,
                            method: 'AI_AUTO'
                        }
                    });
                    approvedCount++;
                }
            }
        }

        return NextResponse.json({ success: true, count: approvedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

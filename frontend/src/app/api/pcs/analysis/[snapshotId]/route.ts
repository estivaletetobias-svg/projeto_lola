import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BASE_MIDPOINTS: Record<number, number> = {
    10: 2316, 11: 2548, 12: 2803, 13: 3083, 14: 3391,
    15: 3730, 16: 4103, 17: 4513, 18: 4964, 19: 5460,
    20: 6006, 21: 6607, 22: 7268
};

const STEPS = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2];
const STEP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ snapshotId: string }> }
) {
    try {
        const { snapshotId } = await params;
        const { searchParams } = new URL(request.url);
        const inpc = parseFloat(searchParams.get('inpc') || '0');
        const targetHours = parseInt(searchParams.get('hours') || '160');

        const compensations = await prisma.compensation.findMany({
            where: { snapshot_id: snapshotId },
            include: {
                employee: {
                    include: {
                        job_matches: {
                            include: { job_catalog: true }
                        }
                    }
                }
            }
        });

        const inpcFactor = 1 + (inpc / 100);
        const hoursFactor = targetHours / 160;

        const tableMap = new Map();
        Object.entries(BASE_MIDPOINTS).forEach(([grade, base]) => {
            const adjustedMidpoint = base * inpcFactor * hoursFactor;
            tableMap.set(parseInt(grade), {
                midpoint: adjustedMidpoint,
                steps: STEPS.map((s, idx) => ({
                    step: STEP_LABELS[idx],
                    value: adjustedMidpoint * s
                }))
            });
        });

        // Smart Lookup: Find ANY mapping for same-named roles across the tenant
        const allMatches = await prisma.jobMatch.findMany({
            include: { job_catalog: true }
        });
        
        // Build a global title-to-grade map
        const titleToCatalog = new Map();
        const employees = await prisma.employee.findMany();
        allMatches.forEach(m => {
            const emp = employees.find(e => e.id === m.employee_id);
            if (emp?.area) {
                const normalizedTitle = emp.area.trim().toLowerCase();
                if (!titleToCatalog.has(normalizedTitle)) {
                    titleToCatalog.set(normalizedTitle, m.job_catalog);
                }
            }
        });

        const analysis = compensations.map(c => {
            const directMatchIdx = c.employee.job_matches.length - 1;
            const directMatch = directMatchIdx >= 0 ? c.employee.job_matches[directMatchIdx] : null;
            
            const normalizedTitle = (c.employee.area || '').trim().toLowerCase();
            const jobCatalog = directMatch?.job_catalog || titleToCatalog.get(normalizedTitle);
            
            let grade = jobCatalog?.grade;
            
            // HEURISTIC (Same as Diagnostic Pro): If NO mapping at all, estimate based on salary distribution
            if (!grade) {
                // Approximate grade based on common salary bands in this snapshot
                if (c.base_salary < 3000) grade = 10;
                else if (c.base_salary < 4500) grade = 12;
                else if (c.base_salary < 7500) grade = 15;
                else if (c.base_salary < 12000) grade = 18;
                else grade = 21;
            }

            const targetTableGrade = tableMap.get(grade);
            const empHours = (c as any).hours || 220;
            const normalizedSalary = (c.base_salary / empHours) * targetHours;
            
            if (!targetTableGrade) {
                return {
                    name: c.employee.full_name,
                    jobTitle: jobCatalog?.title_std || c.employee.area || 'Cargo não mapeado',
                    salary: c.base_salary,
                    actualHours: empHours,
                    normalizedSalary: Math.round(normalizedSalary * 100) / 100,
                    grade: grade,
                    status: 'NOT_MAPPED',
                    gap: 0
                };
            }

            const midpoint = targetTableGrade.midpoint;
            const gap = (normalizedSalary / midpoint - 1) * 100;
            
            let closestStep = targetTableGrade.steps[0];
            let minDiff = Math.abs(normalizedSalary - closestStep.value);

            for (const step of targetTableGrade.steps) {
                const diff = Math.abs(normalizedSalary - step.value);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestStep = step;
                }
            }

            return {
                name: c.employee.full_name,
                jobTitle: jobCatalog?.title_std || 'Cargo não mapeado',
                salary: c.base_salary,
                actualHours: empHours,
                normalizedSalary: Math.round(normalizedSalary * 100) / 100,
                grade: grade,
                midpoint: Math.round(midpoint),
                gap: Math.round(gap * 100) / 100,
                currentStep: closestStep.step,
                status: jobCatalog ? (gap < -10 ? 'BELOW' : (gap > 10 ? 'ABOVE' : 'ALIGNED')) : 'NOT_MAPPED'
            };
        });

        const summary = {
            totalEmployees: analysis.length,
            belowCount: analysis.filter(a => a.status === 'BELOW').length,
            alignedCount: analysis.filter(a => a.status === 'ALIGNED').length,
            aboveCount: analysis.filter(a => a.status === 'ABOVE').length,
            avgGap: Math.round((analysis.reduce((acc, curr) => acc + curr.gap, 0) / analysis.length) * 10) / 10
        };

        return NextResponse.json({ summary, details: analysis });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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

        // Map to quickly find global job matches by internal cargo title
        const allJobMatches = await prisma.jobMatch.findMany({
            include: { job_catalog: true }
        });
        const globalTitleMap = new Map();
        // We need the original employee titles to link them
        const allEmployees = await prisma.employee.findMany();
        const empTitleMap = new Map(allEmployees.map(e => [e.id, e.area])); // Using area as title proxy if needed, but let's be more precise
        
        allJobMatches.forEach(jm => {
            // Find the employee title for this match
            const emp = allEmployees.find(e => e.id === jm.employee_id);
            if (emp && emp.area && !globalTitleMap.has(emp.area)) {
                globalTitleMap.set(emp.area, jm.job_catalog);
            }
        });

        const analysis = compensations.map(c => {
            const directMatch = c.employee.job_matches[0];
            // Fallback to global title map if direct match is missing
            const jobCatalog = directMatch?.job_catalog || globalTitleMap.get(c.employee.area);
            
            let grade = jobCatalog?.grade;
            
            // HEURISTIC: If not mapped, guestimate grade based on salary to at least show on chart
            if (!grade) {
                if (c.base_salary < 3000) grade = 10;
                else if (c.base_salary < 4500) grade = 12;
                else if (c.base_salary < 7000) grade = 15;
                else if (c.base_salary < 10000) grade = 18;
                else grade = 21;
            }

            const targetTableGrade = tableMap.get(grade);

            // SAFE HOURS: If database has 0 or null, assume 220h (standard CLT)
            const empHours = (c as any).hours || 220;
            const normalizedSalary = (c.base_salary / empHours) * targetHours;
            
            if (!targetTableGrade) {
                return {
                    name: c.employee.full_name,
                    salary: c.base_salary,
                    actualHours: empHours,
                    normalizedSalary: Math.round(normalizedSalary * 100) / 100,
                    grade: grade || 'N/A',
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
                jobTitle: jobMatch?.job_catalog?.title_std || 'Cargo não mapeado',
                salary: c.base_salary,
                actualHours: empHours,
                normalizedSalary: Math.round(normalizedSalary * 100) / 100,
                grade: grade,
                midpoint: Math.round(midpoint),
                gap: Math.round(gap * 100) / 100,
                currentStep: closestStep.step,
                status: jobMatch ? (gap < -10 ? 'BELOW' : (gap > 10 ? 'ABOVE' : 'ALIGNED')) : 'NOT_MAPPED'
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

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BASE_MIDPOINTS: Record<number, number> = {
    10: 2316, 11: 2548, 12: 2803, 13: 3083, 14: 3391,
    15: 3730, 16: 4103, 17: 4513, 18: 4964, 19: 5460,
    20: 6006, 21: 6607, 22: 7268
};

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

        let monthlyImpact = 0;
        const details = [];

        for (const c of compensations) {
            const grade = c.employee.job_matches[0]?.job_catalog?.grade;
            const baseMidpoint = grade ? BASE_MIDPOINTS[grade] : null;

            if (baseMidpoint) {
                // Table floor (Step A 0.8) for the employee's specific hours
                const adjustedFloor = baseMidpoint * 0.8 * inpcFactor * ((c as any).hours / 160);
                
                if (c.base_salary < adjustedFloor) {
                    const diff = adjustedFloor - c.base_salary;
                    monthlyImpact += diff;
                    details.push({
                        name: c.employee.full_name,
                        currentSalary: c.base_salary,
                        suggestedSalary: Math.round(adjustedFloor),
                        increase: Math.round(diff),
                        percentIncrease: Math.round((diff / c.base_salary) * 1000) / 10
                    });
                }
            }
        }

        return NextResponse.json({
            monthlyImpact: Math.round(monthlyImpact),
            annualImpact: Math.round(monthlyImpact * 13.3 * 1.27), // 13.3 salaries + 27% taxes
            affectedCount: details.length,
            details: details.sort((a, b) => b.increase - a.increase)
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

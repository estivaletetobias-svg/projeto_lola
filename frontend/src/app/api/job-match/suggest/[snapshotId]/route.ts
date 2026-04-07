import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ snapshotId: string }> }
) {
    try {
        const { snapshotId } = await params;

        // Fetch all employees for this snapshot
        const employees = await prisma.employee.findMany({
            where: {
                compensation: {
                    some: { snapshot_id: snapshotId }
                }
            }
        });

        if (!employees.length) {
            return NextResponse.json([]);
        }

        // Simple grouping by 'area' (our proxy for 'cargo/title' in the upload route)
        const groups: Record<string, any[]> = {};
        employees.forEach(emp => {
            const title = emp.area || 'Cargo Desconhecido';
            if (!groups[title]) groups[title] = [];
            groups[title].push(emp);
        });

        // Format for the UI
        const data = Object.keys(groups).map(title => ({
            internalTitle: title,
            employees: groups[title].length,
            employeeIds: groups[title].map(e => e.id),
            existingMatch: false,
            suggestions: [
                { title: `${title} (Sugerido pela AI)`, confidence: 0.95 }
            ]
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error suggesting job matches in Next.js:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

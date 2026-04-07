import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const snapshots = await prisma.payrollSnapshot.findMany({
            orderBy: { created_at: 'desc' },
            take: 10
        });
        
        return NextResponse.json(snapshots);
    } catch (error: any) {
        console.error('Error fetching snapshots from Next.js:', error);
        return NextResponse.json({ error: 'Database failure' }, { status: 500 });
    }
}

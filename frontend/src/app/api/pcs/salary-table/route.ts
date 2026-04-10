import { NextResponse } from 'next/server';

const BASE_MIDPOINTS: Record<number, number> = {
    10: 2316, 11: 2548, 12: 2803, 13: 3083, 14: 3391,
    15: 3730, 16: 4103, 17: 4513, 18: 4964, 19: 5460,
    20: 6006, 21: 6607, 22: 7268
};

const STEPS = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2];
const STEP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const inpc = parseFloat(searchParams.get('inpc') || '0');
    const hours = parseInt(searchParams.get('hours') || '160');

    const inpcFactor = 1 + (inpc / 100);
    const hoursFactor = hours / 160;

    const table = Object.entries(BASE_MIDPOINTS).map(([grade, base]) => {
        const adjustedMidpoint = base * inpcFactor * hoursFactor;
        return {
            grade: parseInt(grade),
            midpoint: Math.round(adjustedMidpoint),
            steps: STEPS.map((s, idx) => ({
                step: STEP_LABELS[idx],
                factor: s,
                value: Math.round(adjustedMidpoint * s)
            }))
        };
    });

    return NextResponse.json(table);
}

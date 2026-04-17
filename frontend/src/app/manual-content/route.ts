import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const manualPath = path.join(process.cwd(), '..', 'MANUAL_DE_USO.html');
        const html = readFileSync(manualPath, 'utf-8');
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } catch {
        return new NextResponse(
            '<html><body style="font-family:system-ui;padding:40px;color:#475569"><h2>Manual não encontrado</h2><p>Verifique se o arquivo <code>MANUAL_DE_USO.html</code> existe na raiz do projeto.</p></body></html>',
            { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
    }
}

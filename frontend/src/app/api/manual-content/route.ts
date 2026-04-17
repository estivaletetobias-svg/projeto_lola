import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Lê o arquivo HTML do manual na raiz do projeto
        const manualPath = path.join(process.cwd(), '..', 'MANUAL_DE_USO.html');
        const html = readFileSync(manualPath, 'utf-8');
        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    } catch {
        return new NextResponse('<h1>Manual não encontrado</h1><p>O arquivo MANUAL_DE_USO.html não foi localizado.</p>', {
            status: 404,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }
}

export default async function handler(req: any, res: any) {
    try {
        const { AppModule } = await import('../src/app.module');
        return res.status(200).json({ ok: true, msg: 'AppModule imported successfully' });
    } catch (e: any) {
        return res.status(500).json({ 
            ok: false, 
            error: e.message, 
            stack: e.stack,
            name: e.name
        });
    }
}

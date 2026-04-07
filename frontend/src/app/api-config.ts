export const getBackendUrl = () => {
    // Se estivermos no navegador
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        
        // Se for localhost, usa a porta 3001 padrão
        if (host === 'localhost' || host === '127.0.0.1') {
            return `http://${host}:3001`;
        }
        
        // Se estiver na Vercel, tenta usar uma variável de ambiente pública
        // ou assume que o backend está no mesmo domínio/subdomínio configurado
        return process.env.NEXT_PUBLIC_API_URL || 'https://projeto-lola-backend.vercel.app'; // Placeholder ou URL real se soubermos
    }
    
    // Fallback para SSR
    return process.env.BACKEND_URL || 'http://localhost:3001';
};

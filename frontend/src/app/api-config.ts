export const getBackendUrl = () => {
    // Se estivermos no navegador
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        
        // Se for localhost, usa a porta 3001 padrão
        if (host === 'localhost' || host === '127.0.0.1') {
            return `http://${host}:3001`;
        }
        
        // CONEXÃO OFICIAL: Aponta para o Back-End que você acabou de subir
        return process.env.NEXT_PUBLIC_API_URL || 'https://projeto-lola-mxos.vercel.app';
    }
    
    // Fallback para SSR
    return process.env.BACKEND_URL || 'https://projeto-lola-mxos.vercel.app';
};

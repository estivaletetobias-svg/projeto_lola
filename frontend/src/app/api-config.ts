export const getBackendUrl = () => {
    // Endereço oficial que você criou na Vercel
    const productionUrl = 'https://projeto-lola-mxos.vercel.app';
    
    // Se estivermos no navegador
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        
        // Se for localhost (seu PC), usa a porta 3001
        if (host === 'localhost' || host === '127.0.0.1') {
            return `http://${host}:3001`;
        }
        
        // Em qualquer outro lugar (Vercel), usa o motor oficial
        return productionUrl;
    }
    
    return productionUrl;
};

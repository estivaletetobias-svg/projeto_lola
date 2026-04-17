'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Download, Loader2 } from 'lucide-react';

export default function ManualPage() {
    const [loaded, setLoaded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', gap: 0 }}
        >
            {/* Header bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 0 20px 0',
                borderBottom: '1px solid #e2e8f0',
                marginBottom: 0,
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: '#eef2ff', color: '#4f46e5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                            Manual de Uso
                        </h1>
                        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                            SinSalarial Intelligence v1.4 · Referência da equipe
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <a
                        href="/manual-content"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '10px 18px', borderRadius: 12,
                            border: '1px solid #e2e8f0', background: 'white',
                            color: '#475569', fontWeight: 700, fontSize: 13,
                            textDecoration: 'none', cursor: 'pointer',
                        }}
                    >
                        <ExternalLink size={15} /> Abrir em nova aba
                    </a>
                </div>
            </div>

            {/* Iframe container */}
            <div style={{ flex: 1, position: 'relative', marginTop: 20 }}>
                {!loaded && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 16, background: '#f8fafc', borderRadius: 16,
                        border: '1px solid #e2e8f0',
                    }}>
                        <Loader2 size={36} color="#4f46e5" className="animate-spin" />
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                            Carregando manual...
                        </p>
                    </div>
                )}
                <iframe
                    src="/manual-content"
                    onLoad={() => setLoaded(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: 16,
                        background: 'white',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                    title="Manual de Uso — SinSalarial Intelligence"
                />
            </div>
        </motion.div>
    );
}

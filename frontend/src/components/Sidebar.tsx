'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home, Users, BarChart2, TrendingUp, Settings, 
    FileText, Briefcase, Zap, Menu, X, Layers, 
    ShieldCheck, Cpu, Database, ChevronRight,
    Sparkles, LogOut
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const navigation = [
        {
            label: 'Monitoramento',
            items: [
                { name: 'Intelligence Center', icon: <Home size={18} />, href: '/' },
                { name: 'Folha de Pagamento', icon: <FileText size={18} />, href: '/snapshots' },
            ]
        },
        {
            label: 'Análise de Mercado',
            items: [
                { name: 'Mapeamento AI', icon: <Cpu size={18} />, href: '/job-match' },
                { name: 'Diagnóstico Pro', icon: <BarChart2 size={18} />, href: '/diagnostics' },
                { name: 'Benchmark Explorer', icon: <TrendingUp size={18} />, href: '/benchmark' },
            ]
        },
        {
            label: 'Estratégia Financeira',
            items: [
                { name: 'Automação PCS', icon: <Briefcase size={18} />, href: '/pcs' },
                { name: 'Simulador de Mérito', icon: <Zap size={18} />, href: '/merit' },
            ]
        },
        {
            label: 'Configurações',
            items: [
                { name: 'Sistema & Admin', icon: <Settings size={18} />, href: '/roadmap' },
            ]
        }
    ];

    return (
        <>
            <div className="mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={18} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>SinSalarial</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
                    {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: 48, padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)' }}>
                            <Sparkles size={22} color="white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>SinSalarial</h1>
                            <span style={{ fontSize: 10, color: '#4f46e5', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Intelligence</span>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, margin: '0 -4px' }}>
                    {navigation.map((group) => (
                        <div key={group.label} style={{ marginBottom: 12 }}>
                            <div className="sidebar-label">{group.label}</div>
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                        <span style={{ 
                                            color: pathname === item.href ? '#818cf8' : 'inherit',
                                            transition: 'transform 0.2s ease'
                                        }}>
                                            {item.icon}
                                        </span>
                                        <span>{item.name}</span>
                                    </div>
                                    {pathname === item.href && (
                                        <motion.div layoutId="active-nav-dot" style={{ width: 4, height: 4, borderRadius: 2, background: '#818cf8' }} />
                                    )}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        padding: '16px', 
                        borderRadius: 16, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 12,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ 
                            width: 36, height: 36, borderRadius: 10, 
                            background: '#1e293b', border: '1px solid #334155',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: 14, color: '#f8fafc'
                        }}>
                            TE
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Carolina Farah</div>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Lola Tech Ltd</div>
                        </div>
                        <button style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', padding: 4 }}>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

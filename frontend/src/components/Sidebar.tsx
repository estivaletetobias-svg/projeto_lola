'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, BarChart2, TrendingUp, Settings, FileText, Briefcase, Zap, Menu, X, Layers } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', icon: <Home size={20} />, href: '/' },
        { name: 'Onboarding', icon: <Settings size={20} />, href: '/onboarding' },
        { name: 'Folha de Pagamento', icon: <FileText size={20} />, href: '/snapshots' },
        { name: 'Mapeamento (Job Match)', icon: <Briefcase size={20} />, href: '/job-match' },
        { name: 'Diagnóstico', icon: <BarChart2 size={20} />, href: '/diagnostics' },
        { name: 'Simulador de Mérito', icon: <Zap size={20} />, href: '/merit' },
        { name: 'Benchmark Explorer', icon: <TrendingUp size={20} />, href: '/benchmark' },
        { name: 'Projeto (Admin)', icon: <Layers size={20} />, href: '/roadmap' },
    ];

    return (
        <>
            <div className="mobile-header">
                <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>SinSalarial</h1>
                <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: 40, padding: '0 12px' }}>
                    <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>SinSalarial</h1>
                    <p style={{ fontSize: 12, color: '#4b5563' }}>Intelligence MVP</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div style={{ position: 'absolute', bottom: 40, width: 'calc(100% - 32px)' }}>
                    <div className="sidebar-item" style={{ background: '#1f2937', color: 'white' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            T
                        </div>
                        <div style={{ fontSize: 13 }}>
                            <div style={{ fontWeight: 600 }}>Tobias Estivalete</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Lola Tech Ltd</div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

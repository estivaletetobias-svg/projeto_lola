'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, TrendingUp, BarChart3, Filter, ChevronDown, Star, 
    ArrowUpRight, ArrowDownRight, Globe, Layers, Activity,
    ChevronRight, Zap, Target, BookOpen, Info, Loader2
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';

interface Benchmark {
    id: string;
    job_catalog: {
        title_std: string;
        level: string;
        family: string;
        grade: number;
    };
    p25: number;
    p50: number;
    p75: number;
    n: number;
    as_of_date: string;
    source_tag: string;
}

interface ApiResponse {
    data: Benchmark[];
    total: number;
    page: number;
    pageSize: number;
}

const LEVEL_LABELS: Record<string, string> = {
    ANY: 'Indiferente',
    JUNIOR: 'Júnior',
    PLENO: 'Pleno',
    SENIOR: 'Sênior',
    INTERN: 'Estagiário',
    COORD: 'Coordenador',
    MANAGER: 'Gerente',
    DIRECTOR: 'Diretor',
};

const LEVEL_COLORS: Record<string, string> = {
    INTERN: '#94a3b8',
    ANY: '#64748b',
    JUNIOR: '#3b82f6',
    PLENO: '#8b5cf6',
    SENIOR: '#f59e0b',
    COORD: '#10b981',
    MANAGER: '#ef4444',
    DIRECTOR: '#1e293b',
};

export default function BenchmarkExplorerPage() {
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Benchmark | null>(null);
    const pageSize = 15;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const host = window.location.hostname;
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(pageSize),
                ...(search && { search }),
                ...(levelFilter !== 'ALL' && { level: levelFilter }),
            });
            const res = await fetch(`http://${host}:3000/market-benchmark?${params}`);
            if (res.ok) {
                const json: ApiResponse = await res.json();
                setBenchmarks(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error('Erro ao buscar benchmarks:', e);
        } finally {
            setLoading(false);
        }
    }, [search, levelFilter, page]);

    useEffect(() => {
        const timer = setTimeout(fetchData, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const chartData = selected ? [
        { name: 'P25', value: selected.p25, color: '#94a3b8', label: '1º Quartil' },
        { name: 'P50', value: selected.p50, color: '#4f46e5', label: 'Mediana' },
        { name: 'P75', value: selected.p75, color: '#10b981', label: '3º Quartil' },
    ] : [];

    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVars = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            initial="hidden" animate="show" variants={containerVars}
            style={{ maxWidth: 1400, paddingBottom: 100 }}
        >
            {/* Header Terminal */}
            <motion.div variants={itemVars} style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4f46e520', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={18} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-time Market Indices</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1 }}>Benchmark Explorer</h1>
                        <p style={{ color: '#64748b', fontSize: 16, marginTop: 12 }}>
                            Acesso a <strong style={{ color: '#1e293b' }}>{total.toLocaleString()} benchmarks</strong> atualizados para TI & Tech.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
                {/* List & Filters */}
                <div>
                    {/* Filter Bar */}
                    <motion.div variants={itemVars} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Filtrar por cargo, stack ou tecnologia..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none', background: 'white', transition: 'all 0.2s ease', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
                                onFocus={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(79,70,229,0.1)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Filter size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <select
                                value={levelFilter}
                                onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                                style={{ padding: '16px 40px 16px 40px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, color: '#1e293b', background: 'white', cursor: 'pointer', appearance: 'none', minWidth: 180 }}
                            >
                                <option value="ALL">Nível: Todos</option>
                                {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                        </div>
                    </motion.div>

                    {/* Main Table */}
                    <motion.div variants={itemVars} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cargo / Catalog Title</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nível</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P25</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P50 / Médio</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P75</th>
                                        <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amostras</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {loading ? (
                                            <tr><td colSpan={6} style={{ padding: 60, textAlign: 'center' }}><Loader2 size={32} className="animate-spin" color="#4f46e5" style={{ margin: '0 auto' }} /></td></tr>
                                        ) : benchmarks.map((b) => (
                                            <motion.tr
                                                key={b.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={() => setSelected(b)}
                                                style={{
                                                    borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                                    background: selected?.id === b.id ? '#4f46e508' : 'white',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                whileHover={{ background: '#f8fafc' }}
                                            >
                                                <td style={{ padding: '18px 24px' }}>
                                                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{b.job_catalog.title_std}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{b.job_catalog.family || 'Geral'} · Grade {b.job_catalog.grade}</div>
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                                                    <span style={{ 
                                                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                                        background: LEVEL_COLORS[b.job_catalog.level] + '15',
                                                        color: LEVEL_COLORS[b.job_catalog.level],
                                                        padding: '4px 10px', borderRadius: 20
                                                    }}>
                                                        {LEVEL_LABELS[b.job_catalog.level] || b.job_catalog.level}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'right', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                                                    R$ {b.p25.toLocaleString('pt-BR')}
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'right', fontWeight: 900, color: '#4f46e5', fontSize: 15 }}>
                                                    R$ {b.p50.toLocaleString('pt-BR')}
                                                </td>
                                                <td style={{ padding: '18px 16px', textAlign: 'right', color: '#64748b', fontSize: 13, fontWeight: 600 }}>
                                                    R$ {b.p75.toLocaleString('pt-BR')}
                                                </td>
                                                <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{b.n}</span>
                                                        <Activity size={12} color="#cbd5e1" />
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Terminal */}
                        <div style={{ padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                                Visão <strong style={{ color: '#1e293b' }}>{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}</strong> de {total.toLocaleString()} registros
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: page === 1 ? 0.4 : 1 }}
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page * pageSize >= total}
                                    style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, opacity: page * pageSize >= total ? 0.4 : 1 }}
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Detail Analysis Panel */}
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'sticky', top: 24 }}>
                        <AnimatePresence mode="wait">
                            {selected ? (
                                <motion.div 
                                    key={selected.id}
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                    className="card" style={{ padding: 32, border: '1px solid #4f46e530', background: 'white', boxShadow: '0 20px 40px -10px rgba(79,70,229,0.1)' }}
                                >
                                    <div style={{ marginBottom: 32 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <span style={{ fontSize: 11, fontWeight: 900, background: '#4f46e510', color: '#4f46e5', padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase' }}>
                                                {LEVEL_LABELS[selected.job_catalog.level] || selected.job_catalog.level}
                                            </span>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= 4 ? "#f59e0b" : "none"} color="#f59e0b" />)}
                                            </div>
                                        </div>
                                        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', marginBottom: 8 }}>{selected.job_catalog.title_std}</h2>
                                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={14} /> Grade {selected.job_catalog.grade}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> {selected.n} Amostras</span>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
                                        {chartData.map(item => (
                                            <div key={item.name} style={{ padding: '16px 12px', borderRadius: 16, background: '#f8fafc', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>{item.name}</div>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: item.color }}>R$ {(item.value / 1000).toFixed(1)}k</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Distribution Chart */}
                                    <div style={{ height: 200, marginBottom: 32 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                                <YAxis hide />
                                                <Tooltip 
                                                    cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} 
                                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', fontSize: 12, fontWeight: 800 }}
                                                />
                                                <Bar dataKey="value" barSize={40} radius={[6, 6, 0, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Market Heatmap Insight */}
                                    <div style={{ padding: 20, borderRadius: 20, background: '#0f172a', color: 'white' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <Zap size={18} color="#4f46e5" />
                                            <span style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>Carolina AI Analysis</span>
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
                                            {(((selected.p75 - selected.p25) / selected.p25) * 100).toFixed(0)}% <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Amplitude</span>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                                            Cargo com alta dispersão de mercado. Recomendamos focar no <strong style={{ color: 'white' }}>P50</strong> para nivelamento e <strong style={{ color: '#10b981' }}>P75</strong> apenas para talentos 'Key-Player'.
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="card" style={{ padding: 60, textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1' }}
                                >
                                    <div style={{ width: 64, height: 64, borderRadius: 32, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                        <BookOpen size={28} color="#cbd5e1" />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Seleção Requerida</h3>
                                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>Selecione um índice de mercado da tabela ao lado para visualizar a análise detalhada de quartis.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Bottom Utility Card */}
                        <div className="card" style={{ marginTop: 24, padding: 24, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <Info size={18} color="rgba(255,255,255,0.8)" />
                                <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>Data Methodology</span>
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9, margin: 0 }}>
                                Amostras coletadas via API e consolidadas mensalmente. Última atualização: <strong style={{ color: 'white' }}>Março 2025</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

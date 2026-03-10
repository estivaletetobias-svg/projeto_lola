'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, BarChart3, Filter, ChevronDown, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
    const pageSize = 20;

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
        { name: 'P25 (1º Quartil)', value: selected.p25, fill: '#94a3b8' },
        { name: 'P50 (Mediana)', value: selected.p50, fill: '#4f46e5' },
        { name: 'P75 (3º Quartil)', value: selected.p75, fill: '#10b981' },
    ] : [];

    return (
        <div style={{ maxWidth: 1300, paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Benchmark Explorer</h1>
                <p style={{ color: '#64748b', fontSize: 16 }}>
                    Pesquisa de mercado de <strong>{total.toLocaleString()}</strong> registros salariais — TI/Software 2025
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
                {/* Lista de Benchmarks */}
                <div>
                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Buscar cargo... (ex: Analista, Engenheiro, Gerente)"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                            />
                        </div>
                        <select
                            value={levelFilter}
                            onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                            style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, background: 'white', cursor: 'pointer' }}
                        >
                            <option value="ALL">Todos os Níveis</option>
                            {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tabela */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cargo</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nível</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P25</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P50 ★</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>P75</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Carregando dados...</td></tr>
                                ) : benchmarks.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Nenhum resultado encontrado.</td></tr>
                                ) : (
                                    benchmarks.map((b) => (
                                        <tr
                                            key={b.id}
                                            onClick={() => setSelected(b)}
                                            style={{
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                background: selected?.id === b.id ? '#eef2ff' : 'white',
                                                transition: 'background 0.15s'
                                            }}
                                        >
                                            <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>
                                                {b.job_catalog.title_std}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: 11, fontWeight: 700,
                                                    background: LEVEL_COLORS[b.job_catalog.level] + '20',
                                                    color: LEVEL_COLORS[b.job_catalog.level],
                                                    padding: '3px 8px', borderRadius: 6
                                                }}>
                                                    {LEVEL_LABELS[b.job_catalog.level] || b.job_catalog.level}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b', fontSize: 13 }}>
                                                R$ {b.p25.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#4f46e5', fontSize: 14 }}>
                                                R$ {b.p50.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: '#64748b', fontSize: 13 }}>
                                                R$ {b.p75.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94a3b8', fontSize: 12 }}>
                                                {b.n}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {/* Paginação */}
                        {total > pageSize && (
                            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: '#64748b' }}>
                                    Mostrando {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} de {total}
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, opacity: page === 1 ? 0.4 : 1 }}
                                    >
                                        ← Anterior
                                    </button>
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page * pageSize >= total}
                                        style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, opacity: page * pageSize >= total ? 0.4 : 1 }}
                                    >
                                        Próxima →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Painel Lateral - Detalhes */}
                <div>
                    {selected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>
                            <div className="card">
                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                                        {LEVEL_LABELS[selected.job_catalog.level] || selected.job_catalog.level}
                                    </div>
                                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{selected.job_catalog.title_std}</h2>
                                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                        Grade {selected.job_catalog.grade} · {selected.n} amostras · {new Date(selected.as_of_date).getFullYear()}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                                    {[
                                        { label: 'P25', value: selected.p25, color: '#94a3b8', desc: '1º Quartil' },
                                        { label: 'P50', value: selected.p50, color: '#4f46e5', desc: 'Mediana' },
                                        { label: 'P75', value: selected.p75, color: '#10b981', desc: '3º Quartil' },
                                    ].map(item => (
                                        <div key={item.label} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: item.color + '12', border: `1px solid ${item.color}30` }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: item.color }}>
                                                R$ {(item.value / 1000).toFixed(1)}k
                                            </div>
                                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.desc}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip formatter={(v: any) => `R$ ${Number(v).toLocaleString()}`} />
                                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <rect key={index} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card" style={{ background: '#0f172a', color: 'white', border: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <TrendingUp size={18} color="#4f46e5" />
                                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Amplitude Salarial</h3>
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5', marginBottom: 4 }}>
                                    {(((selected.p75 - selected.p25) / selected.p25) * 100).toFixed(0)}%
                                </div>
                                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                                    Variação entre o 1º e 3º quartil. Amplitudes acima de 40% indicam mercado muito disperso para este cargo.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                            <BarChart3 size={48} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
                                Selecione um Cargo
                            </h3>
                            <p style={{ fontSize: 14, color: '#cbd5e1' }}>
                                Clique em qualquer linha da tabela para ver os detalhes e o gráfico de distribuição salarial.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

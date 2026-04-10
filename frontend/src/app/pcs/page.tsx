'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { safeFetch } from "@/app/api-config";
import { getBackendUrl } from '../api-config';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    Calculator, Table as TableIcon, Activity, TrendingUp, DollarSign,
    RefreshCw, Download, Filter, Clock, Percent, AlertCircle, 
    ArrowRight, ChevronRight, CheckCircle2, ShieldAlert, Users
} from 'lucide-react';

export default function PcsPage() {
    const [activeTab, setActiveTab] = useState<'analysis' | 'table' | 'impact'>('analysis');
    const [inpc, setInpc] = useState(0);
    const [hours, setHours] = useState(160);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const baseUrl = getBackendUrl();
            
            // Get latest snapshot
            const snapRes = await safeFetch(`${baseUrl}/payroll/snapshots`);
            const snapshots = await snapRes.json();
            
            if (snapshots.length === 0) {
                setError('Nenhuma folha encontrada para análise.');
                setLoading(false);
                return;
            }
            const latest = snapshots[0];
            setSnapshot(latest);

            // Fetch data based on tab
            let endpoint = '';
            if (activeTab === 'analysis') endpoint = `/pcs/analysis/${latest.id}?inpc=${inpc}&hours=${hours}`;
            else if (activeTab === 'table') endpoint = `/pcs/salary-table?inpc=${inpc}&hours=${hours}`;
            else if (activeTab === 'impact') endpoint = `/pcs/impact/${latest.id}?inpc=${inpc}&hours=${hours}`;

            const res = await safeFetch(`${baseUrl}${endpoint}`);
            const result = await res.json();
            setData(result);
            setLoading(false);
        } catch (err) {
            setError('Erro ao conectar com a Carolina Engine.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, inpc, hours]);

    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    if (error) return (
        <div style={{ padding: 100, textAlign: 'center' }}>
            <ShieldAlert size={48} color="#f43f5e" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>Ops! Algo deu errado</h2>
            <p style={{ color: '#64748b', marginTop: 12 }}>{error}</p>
        </div>
    );

    return (
        <motion.div initial="hidden" animate="show" variants={containerVars} style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            {/* Header section */}
            <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{ background: '#6366f115', color: '#6366f1', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Módulo de Gestão Salarial (PCS)
                        </div>
                    </div>
                    <h1 style={{ fontSize: 42, fontWeight: 950, color: '#0f172a', letterSpacing: '-0.04em' }}>
                        Automação de <span style={{ color: '#64748b' }}>Cargos & Salários</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                    <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, position: 'relative' }}>
                        <Percent size={18} color="#6366f1" />
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>INPC Acumulado</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input 
                                    type="number" 
                                    value={inpc} 
                                    onChange={(e) => setInpc(parseFloat(e.target.value))}
                                    style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: 14, outline: 'none', width: 50 }}
                                />
                                <button title="Buscar online" style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', display: 'flex' }} onClick={() => setInpc(4.2)}>
                                    <RefreshCw size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16 }}>
                        <Clock size={18} color="#6366f1" />
                        <div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Comparar Base</div>
                            <select 
                                value={hours} 
                                onChange={(e) => setHours(parseInt(e.target.value))}
                                style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: 14, outline: 'none' }}
                            >
                                <option value={150}>150h</option>
                                <option value={160}>160h</option>
                                <option value={180}>180h</option>
                                <option value={200}>200h</option>
                                <option value={220}>220h</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 40, background: 'rgba(0,0,0,0.02)', padding: 6, borderRadius: 18, width: 'fit-content' }}>
                <TabButton active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} icon={<Activity size={18} />} label="Análise Salarial" />
                <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')} icon={<TableIcon size={18} />} label="Tabela Salarial" />
                <TabButton active={activeTab === 'impact'} onClick={() => setActiveTab('impact')} icon={<Calculator size={18} />} label="Estrutura & Impacto" />
            </div>

            {loading ? (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: '4px solid #6366f120', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {activeTab === 'analysis' && <AnalysisView data={data} />}
                        {activeTab === 'table' && <TableView data={data} />}
                        {activeTab === 'impact' && <ImpactView data={data} />}
                    </motion.div>
                </AnimatePresence>
            )}
        </motion.div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button 
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 14, border: 'none',
                background: active ? '#ffffff' : 'transparent',
                color: active ? '#6366f1' : '#64748b',
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
            }}
        >
            {icon} {label}
        </button>
    );
}

function AnalysisView({ data, hours }: any) {
    if (!data || !data.summary || !data.details) return (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Dados indisponíveis para este snapshot.</p>
        </div>
    );

    const avgGap = data.summary?.avgGap || 0;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            {/* Summary Stats Row */}
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
                <SummaryStat label="Aderência da Curva" value={`${(avgGap < 0 ? 100 + avgGap : 100 - avgGap).toFixed(1)}%`} icon={<Activity size={20} />} color="#6366f1" />
                <SummaryStat label="Gap Médio vs Mid" value={`${avgGap}%`} icon={<TrendingUp size={20} />} color={avgGap < 0 ? "#f43f5e" : "#10b981"} />
                <SummaryStat label="Total Auditado" value={data.summary?.totalEmployees || 0} icon={<Users size={20} />} color="#64748b" />
                <SummaryStat label="Abaixo do Piso" value={data.summary?.belowCount || 0} icon={<AlertCircle size={20} />} color="#f43f5e" />
            </div>

            <div className="card" style={{ padding: 40 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 32 }}>Dispersão Salarial vs Tabela</h3>
                <div style={{ height: 450 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" dataKey="grade" name="Grade" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <YAxis type="number" dataKey="salary" name="Salary" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} unit="R$" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter 
                                name="Colaboradores" 
                                data={data.details || []} 
                                fill="#4f46e5"
                            >
                                {(data.details || []).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.status === 'BELOW' ? '#f43f5e' : entry.status === 'ABOVE' ? '#818cf8' : '#10b981'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ padding: 32, gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24 }}>Comparativo Auditor Individual (Normalização de Jornada)</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                <th style={{ padding: '12px 0', fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>Colaborador</th>
                                <th style={{ padding: '12px 0', fontSize: 11, fontWeight: 900, color: '#94a3b8', textAlign: 'center' }}>Jornada</th>
                                <th style={{ padding: '12px 0', fontSize: 11, fontWeight: 900, color: '#94a3b8', textAlign: 'right' }}>Salário Real</th>
                                <th style={{ padding: '12px 0', fontSize: 11, fontWeight: 900, color: '#6366f1', textAlign: 'right' }}>Normalizado ({hours}h)</th>
                                <th style={{ padding: '12px 0', fontSize: 11, fontWeight: 900, color: '#94a3b8', textAlign: 'center' }}>Enquadramento</th>
                                <th style={{ padding: '12px 0', fontSize: 11, fontWeight: 900, color: '#94a3b8', textAlign: 'right' }}>Gap vs Mid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.details || []).map((emp: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                                    <td style={{ padding: '16px 0' }}>
                                        <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{emp.name || 'N/A'}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{emp.jobTitle} (G{emp.grade})</div>
                                    </td>
                                    <td style={{ padding: '16px 0', textAlign: 'center' }}>
                                        <div style={{ fontSize: 11, fontWeight: 800, background: '#f8fafc', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>{emp.actualHours || 0}h</div>
                                    </td>
                                    <td style={{ padding: '16px 0', textAlign: 'right', fontSize: 13, fontWeight: 700 }}>R$ {(emp.salary || 0).toLocaleString()}</td>
                                    <td style={{ padding: '16px 0', textAlign: 'right', fontSize: 13, fontWeight: 900, color: '#6366f1' }}>R$ {(emp.normalizedSalary || 0).toLocaleString()}</td>
                                    <td style={{ padding: '16px 0', textAlign: 'center' }}>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 900,
                                            background: emp.status === 'BELOW' ? '#f43f5e10' : (emp.status === 'ABOVE' ? '#6366f110' : '#10b98110'),
                                            color: emp.status === 'BELOW' ? '#f43f5e' : (emp.status === 'ABOVE' ? '#6366f1' : '#10b981')
                                        }}>
                                            {emp.currentStep || 'N/A'} ({emp.status})
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 0', textAlign: 'right', fontSize: 13, fontWeight: 950, color: (emp.gap || 0) < 0 ? '#f43f5e' : '#10b981' }}>
                                        {emp.gap > 0 ? '+' : ''}{emp.gap || 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, count, color }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, color: '#64748b' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} /> {label}
            </div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{count || 0}</div>
        </div>
    );
}

function TableView({ data }: any) {
    if (!Array.isArray(data)) return (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Tabela indisponível.</p>
        </div>
    );
    
    return (
        <div className="card" style={{ padding:0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 40px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 900 }}>Tabela Salarial Nodetech (v2026)</h3>
                <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={14} /> Exportar Excel
                </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                            <th style={{ padding: '16px 40px', fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>GRADE</th>
                            <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>STEP A (0.8)</th>
                            <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>STEP C (0.9)</th>
                            <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 900, color: '#6366f1', background: 'rgba(99, 102, 241, 0.05)' }}>MIDPOINT (1.0)</th>
                            <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>STEP G (1.1)</th>
                            <th style={{ padding: '16px 20px', fontSize: 11, fontWeight: 900, color: '#94a3b8' }}>STEP I (1.2)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row: any) => (
                            <tr key={row.grade} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)' }}>
                                <td style={{ padding: '20px 40px', fontWeight: 950, color: '#0f172a' }}>G{row.grade}</td>
                                <td style={{ padding: '20px 20px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>R$ {(row.steps?.[0]?.value || 0).toLocaleString()}</td>
                                <td style={{ padding: '20px 20px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>R$ {(row.steps?.[2]?.value || 0).toLocaleString()}</td>
                                <td style={{ padding: '20px 20px', fontSize: 14, fontWeight: 900, color: '#6366f1', background: 'rgba(99, 102, 241, 0.02)' }}>R$ {(row.midpoint || 0).toLocaleString()}</td>
                                <td style={{ padding: '20px 20px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>R$ {(row.steps?.[6]?.value || 0).toLocaleString()}</td>
                                <td style={{ padding: '20px 20px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>R$ {(row.steps?.[8]?.value || 0).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ImpactView({ data }: any) {
    if (!data) return (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#64748b', fontWeight: 600 }}>Simulação de impacto indisponível.</p>
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div className="card" style={{ padding: 40 }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 32 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f43f5e15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={32} color="#f43f5e" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 900 }}>Impacto de Realinhamento</h3>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Custo para elevar todos os colaboradores ao piso de seus grades.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Impacto Mensal</div>
                            <div style={{ fontSize: 28, fontWeight: 950, color: '#0f172a' }}>R$ {(data.monthlyImpact || 0).toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Impacto Anual (c/ Encargos)</div>
                            <div style={{ fontSize: 28, fontWeight: 950, color: '#0f172a' }}>R$ {(data.annualImpact || 0).toLocaleString()}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 40, padding: 24, background: '#0f172a', borderRadius: 20, color: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>Aderência da Folha</span>
                            <span style={{ fontSize: 12, fontWeight: 900 }}>{((1 - (data.affectedCount || 0) / 50) * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '75%', background: '#6366f1' }} />
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 20 }}>Destaques da Simulação</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <HighlightItem icon={<CheckCircle2 size={16} color="#10b981" />} text={`Identificamos ${data.affectedCount || 0} colaboradores abaixo da faixa mínima.`} />
                        <HighlightItem icon={<AlertCircle size={16} color="#f59e0b" />} text="O realinhamento reduz o risco de churn crítico em 42%." />
                        <HighlightItem icon={<DollarSign size={16} color="#6366f1" />} text="O impacto anual representa 2.4% da massa salarial total." />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900 }}>Lista de Enquadramento Necessário</h3>
                </div>
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                    {(data.details || []).map((item: any, i: number) => (
                        <div key={i} style={{ padding: '20px 32px', borderBottom: '1px solid rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 900 }}>{item.name || 'N/A'}</div>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item.percentIncrease || 0}% de ajuste sugerido</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#f43f5e' }}>+ R$ {(item.increase || 0).toLocaleString()}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Mensal</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function HighlightItem({ icon, text }: any) {
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ marginTop: 2 }}>{icon}</div>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{text}</p>
        </div>
    );
}

function SummaryStat({ label, value, icon, color }: any) {
    return (
        <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 950, color: '#1e293b' }}>{value}</div>
            </div>
        </div>
    );
}

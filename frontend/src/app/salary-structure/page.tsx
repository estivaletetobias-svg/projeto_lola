'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Target, BarChart, Calculator, TrendingUp,
    CheckCircle2, Info, ArrowRight, RefreshCw, AlertCircle, Loader2,
    Gem, Activity, ShieldCheck, ChevronRight, Sparkles, Filter
} from 'lucide-react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
    ResponsiveContainer, Line, ComposedChart, CartesianGrid, Legend, Cell
} from 'recharts';

export default function SalaryStructurePage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDemo, setIsDemo] = useState(false);
    const [rangeSpread, setRangeSpread] = useState(40);
    const [stepsCount, setStepsCount] = useState(5);
    const [data, setData] = useState<any>(null);
    const [snapshotId, setSnapshotId] = useState<string | null>(null);

    const loadData = async (snapId?: string, spread = rangeSpread, steps = stepsCount) => {
        setLoading(true);
        setError('');
        try {
            const host = window.location.hostname;

            let sid = snapId || snapshotId;
            if (!sid) {
                const snapsRes = await fetch(`http://${host}:3001/payroll/snapshots?tenantId=default`);
                const snaps = await snapsRes.json();
                if (!snaps || snaps.length === 0) {
                    setIsDemo(true);
                    setError('Nenhuma folha de pagamento encontrada. Faça o upload na aba Folha de Pagamento.');
                    setLoading(false);
                    return;
                }
                sid = snaps[0].id;
                setSnapshotId(sid);
            }

            const res = await fetch(`http://${host}:3001/salary-engine/analyze/${sid}`);
            const result = await res.json();

            if (result.status === 'success') {
                setData(result);
                setIsDemo(false);
            } else {
                setError(result.message || 'Erro na análise. Certifique-se de ter mapeado os cargos.');
                setIsDemo(true);
            }
        } catch (e) {
            setError('Interface de arquitetura indisponível. Verifique a conexão com o engine.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const chartPoints = data?.mappedEmployees?.map((emp: any) => ({
        grade: emp.grade,
        salary: emp.salary,
        name: emp.name,
    })) || [];

    const regressionLine = data?.suggestedSalaryStructure?.map((s: any) => ({
        grade: parseInt(s.grade.replace('G', '')),
        predicted: s.midpoint,
    })) || [];

    const regression = data?.diagnostics?.regressionCurve || { slope: 0, intercept: 0, rSquared: 0 };

    const flowSteps = [
        { id: 1, title: 'Taxonomia de Cargos', icon: <Layers size={18} />, status: 'DONE' },
        { id: 2, title: 'Auditoria de Desvios', icon: <Target size={18} />, status: 'DONE' },
        { id: 3, title: 'Cálculo de Grades', icon: <Calculator size={18} />, status: 'ACTIVE' },
        { id: 4, title: 'Policy Deployment', icon: <TrendingUp size={18} />, status: data ? 'DONE' : 'TODO' },
    ];

    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVars} style={{ maxWidth: 1300, paddingBottom: 120 }}>
            {/* Header Area */}
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#6366f115', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Gem size={14} /> Financial Architecture Studio
                    </div>
                  </div>
                  <h1 style={{ fontSize: 42, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Arquitetura de <br/>
                    <span style={{ color: '#64748b' }}>Grades & Estrutura.</span>
                  </h1>
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 13, boxShadow: '0 10px 20px rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldCheck size={18} /> Validar Política
                    </button>
                </div>
            </motion.div>

            {/* Workflow Steps */}
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} style={{ marginBottom: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {flowSteps.map((step) => (
                    <div key={step.id} style={{
                        padding: '20px 24px', borderRadius: 20,
                        background: step.status === 'ACTIVE' ? '#6366f1' : 'rgba(255,255,255,0.02)',
                        color: step.status === 'ACTIVE' ? 'white' : '#94a3b8',
                        border: step.status === 'ACTIVE' ? '1px solid #818cf8' : '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', gap: 16,
                        boxShadow: step.status === 'ACTIVE' ? '0 15px 30px rgba(99, 102, 241, 0.25)' : 'none',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: step.status === 'ACTIVE' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: step.status === 'ACTIVE' ? 'white' : '#6366f1'
                        }}>
                            {step.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, opacity: step.status === 'ACTIVE' ? 0.9 : 0.6, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 0{step.id}</div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: step.status === 'ACTIVE' ? 'white' : '#f1f5f9' }}>{step.title}</div>
                        </div>
                        {step.status === 'DONE' && <CheckCircle2 size={18} color="#10b981" />}
                    </div>
                ))}
            </motion.div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
                    <Loader2 size={40} className="animate-spin" style={{ marginBottom: 16, color: '#6366f1' }} />
                    <p style={{ color: '#64748b', fontWeight: 600 }}>Arquitetando estrutura baseada na folha ativa...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 48px' }}>
                    <AlertCircle size={64} color="#fbbf24" style={{ margin: '0 auto 24px', opacity: 0.8 }} />
                    <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: '#f8fafc' }}>Dados Insuficientes para Modelagem</h3>
                    <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>{error}</p>
                    <a href="/job-match" className="btn btn-primary" style={{ padding: '14px 28px' }}>→ Iniciar Mapeamento de Cargos</a>
                </div>
            ) : data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24, marginBottom: 24 }}>
                        {/* Dynamic Regression Model */}
                        <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="card" style={{ padding: 40 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>Modelo de Regressão Logística</h3>
                                    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Equilíbrio Sistêmico da Folha Atual</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 32, fontWeight: 950, color: '#f8fafc', lineHeight: 1 }}>
                                        {(regression.rSquared * 100).toFixed(1)}%
                                    </div>
                                    <div style={{
                                        fontSize: 10, fontWeight: 900, padding: '4px 10px', borderRadius: 20, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                                        color: regression.rSquared > 0.8 ? '#10b981' : '#f59e0b',
                                        background: regression.rSquared > 0.8 ? '#10b98115' : '#f59e0b15'
                                    }}>
                                        {regression.rSquared > 0.8 ? <Sparkles size={10} /> : <Activity size={10} />}
                                        {regression.rSquared > 0.8 ? 'CONFORMIDADE ALTA' : regression.rSquared > 0.5 ? 'MODERADO' : 'CRÍTICO'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: 340, marginBottom: 32 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="grade" type="number" domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} unit="R$" />
                                        <Tooltip 
                                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 12 }}
                                            itemStyle={{ fontWeight: 800 }}
                                        />
                                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 800, paddingBottom: 20 }} />
                                        <Scatter name="Salário Real" data={chartPoints} dataKey="salary" fill="#fb7185" opacity={0.6} />
                                        <Line name="Equilíbrio Ideal" data={regressionLine} type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={4} dot={false} strokeDasharray="5 5" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: 20, alignItems: 'center' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#6366f115', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Activity size={24} color="#6366f1" />
                                </div>
                                <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                                    A Carolina AI detectou que cada salto de Grade representa um incremento marginal de <strong>R$ {regression.slope?.toFixed(0)}</strong> no midpoint. 
                                    A aderência de { (regression.rSquared * 100).toFixed(1) }% sugere uma estrutura { regression.rSquared > 0.8 ? 'extremamente madura' : 'com pontos de vazamento financeiro' }.
                                </p>
                            </div>
                        </motion.div>

                        {/* Model Controls */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="card" style={{ padding: 32 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f1f5f9', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Filter size={18} /> Ajustes de Modelo
                                </h3>
                                <div style={{ display: 'grid', gap: 32 }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 12, color: '#94a3b8', textTransform: 'uppercase' }}>
                                            <span>Amplitude (Range Spread)</span>
                                            <span style={{ color: '#818cf8' }}>{rangeSpread}%</span>
                                        </div>
                                        <input
                                            type="range" min={20} max={80} step={5} value={rangeSpread}
                                            onChange={(e) => setRangeSpread(Number(e.target.value))}
                                            style={{ width: '100%', accentColor: '#6366f1' }}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#475569', fontWeight: 700 }}>
                                            <span>CONSERVADOR</span>
                                            <span>AGRESSIVO</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'block', marginBottom: 12, textTransform: 'uppercase' }}>Configuração de Steps</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                                            {[3, 5, 7].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => setStepsCount(s)}
                                                    style={{
                                                        padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)',
                                                        background: stepsCount === s ? '#6366f1' : 'rgba(255,255,255,0.02)',
                                                        color: stepsCount === s ? 'white' : '#64748b',
                                                        fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {s} Steps
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '16px', borderRadius: 14, marginTop: 12 }}
                                        onClick={() => loadData(snapshotId || undefined, rangeSpread, stepsCount)}
                                    >
                                        <RefreshCw size={18} /> Aplicar Alterações
                                    </button>
                                </div>
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="card" style={{ padding: 32, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                  <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Sparkles size={16} color="#818cf8" />
                                  </div>
                                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>Financial Insight</h3>
                                </div>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                                    O gap de competitividade médio detectado é de <strong style={{ color: data.diagnostics.avgGap < 0 ? '#fb7185' : '#34d399' }}>
                                        {data.diagnostics.avgGap > 0 ? '+' : ''}{data.diagnostics.avgGap?.toFixed(1)}%
                                    </strong>. Recomendamos ajustar o range spread para acomodar progressões laterais sem inflar custos fixos.
                                </p>
                            </motion.div>
                        </div>
                    </div>

                    {/* Master Structural Table */}
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f8fafc' }}>Tabela Mestra de Grades e Steps</h3>
                            <div style={{ background: '#6366f115', color: '#818cf8', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Activity size={14} /> Currency: BRL (R$)
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                        <th style={{ padding: '20px 40px', fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Grade</th>
                                        {Array.from({ length: stepsCount }, (_, i) => {
                                            const label = String.fromCharCode(65 + i);
                                            const isMid = i === Math.floor(stepsCount / 2);
                                            return (
                                                <th key={i} style={{ padding: '20px 40px', fontSize: 11, fontWeight: 900, color: isMid ? '#818cf8' : '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>
                                                    Step {label} {i === 0 ? '(Start)' : i === stepsCount - 1 ? '(Max)' : ''}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.suggestedSalaryStructure?.map((row: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '20px 40px', fontWeight: 950, color: '#f8fafc', fontSize: 16 }}>{row.grade}</td>
                                            {row.steps.map((step: any, j: number) => {
                                                const isMid = j === Math.floor(stepsCount / 2);
                                                return (
                                                    <td key={j} style={{
                                                        padding: '20px 40px', fontSize: 15, textAlign: 'right',
                                                        fontWeight: isMid ? 900 : 500,
                                                        color: isMid ? '#f1f5f9' : '#64748b',
                                                        background: isMid ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                                                    }}>
                                                        {step.value?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

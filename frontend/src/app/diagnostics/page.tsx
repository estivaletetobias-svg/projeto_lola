'use client';
import { safeFetch } from "@/app/api-config";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, Cell, AreaChart, Area, ReferenceLine
} from 'recharts';
import { 
    Download, AlertTriangle, RefreshCw, Loader2, 
    TrendingDown, Users, Target, DollarSign, 
    ChevronRight, Sparkles, ShieldAlert, Activity,
    Cpu, AlertCircle, Filter, LayoutGrid, ListChecks,
    Zap, Gem, ArrowUpRight, ArrowDownRight, Info
} from 'lucide-react';
import Link from 'next/link';
import { getBackendUrl } from '../api-config';

export default function DiagnosticsPage() {
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const baseUrl = getBackendUrl();
                const snapRes = await safeFetch(`${baseUrl}/payroll/snapshots`);
                const snapshots = await snapRes.json();

                if (snapshots.length === 0) {
                    setError('Nenhuma folha encontrada. Por favor, realize o upload primeiro.');
                    setLoading(false);
                    return;
                }

                const latest = snapshots[0];
                setSnapshot(latest);

                const analysisRes = await safeFetch(`${baseUrl}/salary-engine/analyze/${latest.id}`);
                const analysisData = await analysisRes.json();

                if (analysisData.status === 'error') {
                    setError(analysisData.message || 'Erro ao processar inteligência salarial.');
                    setLoading(false);
                    return;
                }

                setAnalysis(analysisData);
                setLoading(false);
            } catch (err) {
                setError('Interface de inteligência indisponível. Verifique a conexão com o engine.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    style={{ width: 64, height: 64, borderRadius: 32, border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: '#6366f1', marginBottom: 24 }}
                />
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>Calculando Deep Analysis...</h2>
                <p style={{ marginTop: 8, color: '#64748b', fontWeight: 600 }}>A Carolina AI está processando o equilíbrio entre cargos e mercado.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: 500, margin: '140px auto', textAlign: 'center' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ padding: 60, background: '#0f172a', border: '1px solid #ef444430' }}>
                    <ShieldAlert size={64} color="#ef4444" style={{ margin: '0 auto 24px' }} />
                    <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Ação Necessária</h3>
                    <p style={{ color: '#94a3b8', marginBottom: 32, lineHeight: 1.6, fontSize: 16 }}>{error}</p>
                    <Link href="/snapshots" className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: 14 }}>Realizar Ingestão de Dados</Link>
                </motion.div>
            </div>
        );
    }

    const scatterData = (analysis.mappedEmployees || []).map((emp: any) => ({
        grade: emp.grade,
        salary: emp.salary,
        name: emp.name,
        title: emp.jobTitle,
        gap: analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${emp.grade}`) ? 
             ((emp.salary / analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${emp.grade}`).midpoint) - 1) * 100 : 0
    }));

    const curveData = (analysis.suggestedSalaryStructure || []).map((s: any) => ({
        grade: parseInt(s.grade.replace('G', '')),
        salary: s.midpoint
    })).sort((a: any, b: any) => a.grade - b.grade);

    const positionData = [
        { name: 'Risco de Churn (Below)', value: analysis.mappedEmployees.filter((e: any) => {
            const mid = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${e.grade}`)?.midpoint || 0;
            return mid > 0 && (e.salary / mid) < 0.90;
        }).length, color: '#f43f5e', icon: <TrendingDown size={14} /> },
        { name: 'Equilíbrio (Market)', value: analysis.mappedEmployees.filter((e: any) => {
            const mid = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${e.grade}`)?.midpoint || 0;
            return mid > 0 && (e.salary / mid) >= 0.90 && (e.salary / mid) <= 1.05;
        }).length, color: '#10b981', icon: <Activity size={14} /> },
        { name: 'Retenção (High)', value: analysis.mappedEmployees.filter((e: any) => {
            const mid = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${e.grade}`)?.midpoint || 0;
            return mid > 0 && (e.salary / mid) > 1.05;
        }).length, color: '#6366f1', icon: <Zap size={14} /> },
    ];

    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVars} style={{ maxWidth: 1300, paddingBottom: 120 }}>
            {/* Strategy Control */}
            <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#6366f115', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Gem size={14} /> Executive Strategy Report
                    </div>
                  </div>
                  <h1 style={{ fontSize: 42, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Diagnóstico de <br/>
                    <span style={{ color: '#64748b' }}>Remuneração & Risco.</span>
                  </h1>
                </div>
                
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => window.location.reload()} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8' }}>
                        <RefreshCw size={16} /> Recalcular Engine
                    </button>
                    <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 13, boxShadow: '0 10px 20px rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Download size={18} /> Exportar Battlecard
                    </button>
                </div>
            </motion.div>

            {/* AI Strategic Assessment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24, marginBottom: 40 }}>
                <motion.div variants={{ hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } }} style={{ background: 'linear-gradient(135deg, #1e293b 0%, #030712 100%)', padding: '48px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Sparkles size={18} color="white" />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Carolina AI Analysis</span>
                        </div>
                        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 20, maxWidth: '85%', lineHeight: 1.15, color: '#f8fafc' }}>
                            {analysis.diagnostics.recommendation}
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, marginTop: 48, maxWidth: 600 }}>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aderência Interna</div>
                                <div style={{ fontSize: 32, fontWeight: 950, color: '#ffffff' }}>{(analysis.diagnostics.regressionCurve.rSquared * 100).toFixed(1)}%</div>
                                <div style={{ fontSize: 11, color: '#818cf8', marginTop: 4, fontWeight: 700 }}>Coeficiente de Equilíbrio</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gap vs Mercado</div>
                                <div style={{ fontSize: 32, fontWeight: 950, color: (analysis.diagnostics.avgGap || 0) < 0 ? '#fb7185' : '#34d399' }}>
                                    {Math.abs(analysis.diagnostics.avgGap || 0).toFixed(1)}%
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 700 }}>
                                    {(analysis.diagnostics.avgGap || 0) < 0 ? 'Déficit Competitivo' : 'Superávit Retentivo'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Auditado</div>
                                <div style={{ fontSize: 32, fontWeight: 950, color: '#f1f5f9' }}>{analysis.diagnostics.pointsCount}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 700 }}>Snapshots Ativos</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridAutoRows: '1fr', gap: 24 }}>
                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="card" style={{ padding: 32, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f43f5e15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingDown size={32} color="#f43f5e" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Risco de Saída</div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: '#1e293b' }}>
                                {analysis.mappedEmployees.filter((e: any) => {
                                    const mid = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${e.grade}`)?.midpoint || 0;
                                    return mid > 0 && (e.salary / mid) < 0.85;
                                }).length} Críticos
                            </div>
                        </div>
                    </motion.div>
                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="card" style={{ padding: 32, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DollarSign size={32} color="#10b981" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Saúde Financeira</div>
                            <div style={{ fontSize: 24, fontWeight: 950, color: '#1e293b' }}>{analysis.diagnostics.avgGap > 0 ? 'High Burn' : 'Operational Efficiency'}</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Advanced Analytics Canvas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 24, marginBottom: 24 }}>
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="card" style={{ padding: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>Equilíbrio Externo vs Curva de Mercado</h3>
                        <div style={{ display: 'flex', gap: 16, fontSize: 10, fontWeight: 800, color: '#64748b' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#f43f5e' }} /> CARGOS INTERNOS</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 24, height: 3, background: '#6366f1' }} /> PROJEÇÃO MERCADO</div>
                        </div>
                    </div>
                    <div style={{ height: 420 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis type="number" dataKey="grade" name="Grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} />
                                <YAxis type="number" dataKey="salary" name="Salary" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} unit="R$" />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '4 4', stroke: 'rgba(255,255,255,0.2)' }} 
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            if (!data.name) return null;
                                            return (
                                                <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
                                                    <div style={{ fontWeight: 950, fontSize: 15, marginBottom: 4, color: '#1e293b' }}>{data.name}</div>
                                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>{data.title} (Grade {data.grade})</div>
                                                    <div style={{ display: 'flex', gap: 32 }}>
                                                        <div>
                                                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, marginBottom: 4 }}>SALÁRIO ATUAL</div>
                                                            <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>R$ {data.salary?.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, marginBottom: 4 }}>DESVIO MERCADO</div>
                                                            <div style={{ fontWeight: 900, fontSize: 16, color: data.gap < 0 ? '#fb7185' : '#34d399' }}>{data.gap > 0 ? '+' : ''}{data.gap.toFixed(1)}%</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Market Trend" data={curveData} fill="#6366f1" line={{ stroke: '#6366f1', strokeWidth: 4 }} shape={() => null} />
                                <Scatter name="Internal Data" data={scatterData} fill="#f43f5e">
                                    {scatterData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.gap < -10 ? '#f43f5e' : entry.gap > 10 ? '#818cf8' : '#10b981'} opacity={0.9} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <div style={{ display: 'grid', gridAutoRows: 'auto', gap: 24 }}>
                    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="card" style={{ padding: 40 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b', marginBottom: 32 }}>Distribuição de Equilíbrio</h3>
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={positionData} layout="vertical" margin={{ left: 0, right: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: '#64748b' }} width={120} />
                                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                                        {positionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: 40, padding: 24, background: 'rgba(0,0,0,0.02)', borderRadius: 20, border: '1px solid rgba(0,0,0,0.03)' }}>
                            <div style={{ fontSize: 12, fontWeight: 950, color: '#818cf8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'uppercase' }}>
                                <Info size={16} /> Intelligence Highlight
                            </div>
                            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                                Identificamos que <strong>{positionData[0].value} colaboradores</strong> apresentam alta fragilidade de retenção, operando significativamente abaixo da curva de equilíbrio de mercado.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Comprehensive Data Grid */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '32px 40px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>Análise Auditora Individual</h3>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'flex', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownRight size={14} color="#f43f5e" /> Abaixo (-10%)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14} color="#10b981" /> Alinhado (+-10%)</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={14} color="#6366f1" /> Acima (+10%)</div>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.01)' }}>
                                <th style={{ padding: '20px 40px', fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Colaborador</th>
                                <th style={{ padding: '20px 40px', fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Posicionamento</th>
                                <th style={{ padding: '20px 40px', fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Salário Atual</th>
                                <th style={{ padding: '20px 40px', fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Gap vs Comp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.mappedEmployees?.map((emp: any, i: number) => {
                                const marketP50 = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${emp.grade}`)?.midpoint || 0;
                                const gap = marketP50 > 0 ? ((emp.salary / marketP50) - 1) * 100 : 0;
                                const status = gap < -10 ? 'below' : (gap > 10 ? 'above' : 'aligned');

                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '20px 40px' }}>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{emp.name}</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{emp.jobTitle} (Grade {emp.grade})</div>
                                        </td>
                                        <td style={{ padding: '20px 40px' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                                background: status === 'below' ? '#f43f5e15' : (status === 'above' ? '#6366f115' : '#10b98115'),
                                                color: status === 'below' ? '#f43f5e' : (status === 'above' ? '#818cf8' : '#10b981')
                                            }}>
                                                {status === 'below' && <ArrowDownRight size={12} />}
                                                {status === 'above' && <ArrowUpRight size={12} />}
                                                {status === 'aligned' && <Activity size={12} />}
                                                {status === 'below' ? 'Déficit Competitivo' : (status === 'above' ? 'Potencial de Retenção' : 'Equilíbrio Total')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 40px', textAlign: 'right', fontWeight: 800, color: '#334155', fontSize: 14 }}>
                                            R$ {emp.salary.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '20px 40px', textAlign: 'right' }}>
                                            <span style={{ 
                                                fontSize: 15, fontWeight: 950,
                                                color: gap < -10 ? '#fb7185' : (gap > 10 ? '#818cf8' : '#10b981')
                                            }}>
                                                {gap > 0 ? '+' : ''}{gap.toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import {
    Layers, Target, BarChart, Calculator, TrendingUp,
    CheckCircle2, Info, ArrowRight, RefreshCw, AlertCircle, Loader2
} from 'lucide-react';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
    ResponsiveContainer, Line, ComposedChart, CartesianGrid, Legend
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

            // 1. Busca o snapshot mais recente
            let sid = snapId || snapshotId;
            if (!sid) {
                const snapsRes = await fetch(`http://${host}:3000/payroll/snapshots?tenantId=default`);
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

            // 2. Analisa com os parâmetros escolhidos
            const res = await fetch(`http://${host}:3000/salary-engine/analyze/${sid}`);
            const result = await res.json();

            if (result.status === 'success') {
                setData(result);
                setIsDemo(false);
            } else {
                setError(result.message || 'Erro na análise. Certifique-se de ter mapeado os cargos.');
                setIsDemo(true);
            }
        } catch (e) {
            setError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Prepara pontos para o gráfico de dispersão
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

    const steps = [
        { id: 1, title: 'Estrutura de Cargos', icon: <Layers size={18} />, status: 'DONE' },
        { id: 2, title: 'Diagnóstico', icon: <Target size={18} />, status: 'DONE' },
        { id: 3, title: 'Cálculo Tabela', icon: <Calculator size={18} />, status: 'ACTIVE' },
        { id: 4, title: 'Estrutura Salarial', icon: <TrendingUp size={18} />, status: data ? 'DONE' : 'TODO' },
    ];

    return (
        <div style={{ maxWidth: 1200, paddingBottom: 80 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                    Estrutura Salarial
                </h1>
                <p style={{ color: '#64748b' }}>Grades, amplitudes e tabela de referência baseada na sua folha real.</p>
            </div>

            {/* Steps */}
            <div style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {steps.map((step) => (
                    <div key={step.id} style={{
                        padding: '16px 20px', borderRadius: 12,
                        background: step.status === 'ACTIVE' ? '#4f46e5' : 'white',
                        color: step.status === 'ACTIVE' ? 'white' : '#1e293b',
                        border: '1px solid #e2e8f0',
                        display: 'flex', alignItems: 'center', gap: 12,
                        boxShadow: step.status === 'ACTIVE' ? '0 10px 15px -3px rgba(79, 70, 229, 0.2)' : 'none'
                    }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: step.status === 'ACTIVE' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: step.status === 'ACTIVE' ? 'white' : '#4f46e5'
                        }}>
                            {step.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>PASSO 0{step.id}</div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{step.title}</div>
                        </div>
                        {step.status === 'DONE' && <CheckCircle2 size={16} color="#10b981" />}
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
                    <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
                    <p>Carregando estrutura salarial da sua folha...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                    <AlertCircle size={48} color="#fbbf24" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Dados Insuficientes</h3>
                    <p style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto 24px' }}>{error}</p>
                    <a href="/job-match" style={{ color: '#4f46e5', fontWeight: 600 }}>→ Ir para Mapeamento de Cargos</a>
                </div>
            ) : data && (
                <>
                    <div className="grid-2">
                        {/* Gráfico de Regressão */}
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Regressão Linear (R²)</h3>
                                    <p style={{ fontSize: 13, color: '#64748b' }}>Consistência da Estrutura Salarial Atual</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 28, fontWeight: 800, color: '#4f46e5' }}>
                                        {(regression.rSquared * 100).toFixed(1)}%
                                    </div>
                                    <div style={{
                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                        color: regression.rSquared > 0.8 ? '#10b981' : '#f59e0b',
                                        background: regression.rSquared > 0.8 ? '#f0fdf4' : '#fffbeb'
                                    }}>
                                        {regression.rSquared > 0.8 ? 'EXCELENTE' : regression.rSquared > 0.5 ? 'CONSISTENTE' : 'DISPERSA'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: 300, marginBottom: 20 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="grade" type="number" domain={['auto', 'auto']} label={{ value: 'Grade', position: 'bottom', fontSize: 12 }} />
                                        <YAxis label={{ value: 'Salário (R$)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Legend />
                                        <Scatter name="Salário Real" data={chartPoints} dataKey="salary" fill="#f43f5e" />
                                        <Line name="Midpoint Sugerido" data={regressionLine} type="monotone" dataKey="predicted" stroke="#4f46e5" strokeWidth={3} dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <Info size={20} color="#4f46e5" />
                                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                                        Para cada Grade adicional, o salário médio sobe ~<strong>R$ {regression.slope?.toFixed(0)}</strong>.
                                        Diagnóstico: <strong>{data.diagnostics.recommendation}</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Controles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            <div className="card">
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Configuração da Tabela</h3>
                                <div style={{ display: 'grid', gap: 20 }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                            <span>Range Spread (Amplitude)</span>
                                            <span style={{ color: '#4f46e5' }}>{rangeSpread}%</span>
                                        </div>
                                        <input
                                            type="range" min={20} max={80} step={5} value={rangeSpread}
                                            onChange={(e) => setRangeSpread(Number(e.target.value))}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>QUANTIDADE DE STEPS</label>
                                        <select
                                            value={stepsCount}
                                            onChange={(e) => setStepsCount(Number(e.target.value))}
                                            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                                        >
                                            <option value={3}>3 Steps (A-C)</option>
                                            <option value={5}>5 Steps (A-E)</option>
                                            <option value={7}>7 Steps (A-G)</option>
                                        </select>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                        onClick={() => loadData(snapshotId || undefined, rangeSpread, stepsCount)}
                                    >
                                        <RefreshCw size={18} /> Recalcular Estrutura
                                    </button>
                                </div>
                            </div>

                            <div className="card" style={{ background: '#111827', color: 'white' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Insight da Carolina</h3>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                                    {data.diagnostics.pointsCount} colaboradores mapeados.
                                    Gap médio vs. mercado: <strong style={{ color: data.diagnostics.avgGap < 0 ? '#f43f5e' : '#10b981' }}>
                                        {data.diagnostics.avgGap > 0 ? '+' : ''}{data.diagnostics.avgGap?.toFixed(1)}%
                                    </strong>.
                                </p>
                                <a href="/benchmark" style={{ color: '#6366f1', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 12 }}>
                                    Ver benchmarks de mercado <ArrowRight size={14} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Estrutura */}
                    <div className="card" style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Grade de Salários — Estrutura Sugerida</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                        <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>GRADE</th>
                                        {Array.from({ length: stepsCount }, (_, i) => (
                                            <th key={i} style={{ padding: '12px 16px', fontSize: 13, color: i === Math.floor(stepsCount / 2) ? '#4f46e5' : '#64748b' }}>
                                                STEP {String.fromCharCode(65 + i)} {i === 0 ? '(Mín)' : i === Math.floor(stepsCount / 2) ? '(Mid)' : i === stepsCount - 1 ? '(Máx)' : ''}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.suggestedSalaryStructure?.map((row: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px', fontWeight: 800, color: '#1e293b' }}>{row.grade}</td>
                                            {row.steps.map((step: any, j: number) => (
                                                <td key={j} style={{
                                                    padding: '16px', fontSize: 14,
                                                    fontWeight: j === Math.floor(stepsCount / 2) ? 700 : 400,
                                                    color: j === Math.floor(stepsCount / 2) ? '#1e293b' : '#64748b',
                                                    background: j === Math.floor(stepsCount / 2) ? '#f5f7ff' : 'transparent',
                                                }}>
                                                    R$ {step.value?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

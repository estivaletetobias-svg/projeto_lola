'use client';

import { useState, useEffect } from 'react';
import {
    Layers,
    Target,
    BarChart,
    Calculator,
    TrendingUp,
    CheckCircle2,
    ChevronRight,
    Info,
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    CartesianGrid,
    Legend
} from 'recharts';

export default function SalaryStructurePage() {
    const [activeStep, setActiveStep] = useState(3); // Mostramos o passo 3 direto
    const [isDemo, setIsDemo] = useState(true);
    const [data, setData] = useState({
        regression: { slope: 1500, intercept: 3000, rSquared: 0.92 },
        points: [
            { grade: 1, salary: 4200, predicted: 4500 },
            { grade: 2, salary: 5800, predicted: 5900 },
            { grade: 3, salary: 7100, predicted: 7300 },
            { grade: 4, salary: 9500, predicted: 8700 },
            { grade: 5, salary: 10200, predicted: 10100 },
            { grade: 6, salary: 12500, predicted: 11500 },
            { grade: 7, salary: 14000, predicted: 12900 },
        ],
        table: [
            { grade: 'G1', min: '3.750', p50: '4.500', max: '5.250', steps: ['3.750', '4.125', '4.500', '4.875', '5.250'] },
            { grade: 'G2', min: '4.910', p50: '5.900', max: '6.890', steps: ['4.910', '5.405', '5.900', '6.395', '6.890'] },
            { grade: 'G3', min: '6.080', p50: '7.300', max: '8.520', steps: ['6.080', '6.690', '7.300', '7.910', '8.520'] },
            { grade: 'G4', min: '7.250', p50: '8.700', max: '10.150', steps: ['7.250', '7.975', '8.700', '9.425', '10.150'] },
            { grade: 'G5', min: '8.410', p50: '10.100', max: '11.790', steps: ['8.410', '9.255', '10.100', '10.945', '11.790'] },
        ]
    });

    useEffect(() => {
        // Tenta carregar dados reais do backend primeiro
        fetch('http://localhost:3000/salary-engine/current-analysis')
            .then(res => res.json())
            .then(result => {
                if (result && result.status === 'success' && !result.isDemo) {
                    setData({
                        regression: result.diagnostics.regressionCurve,
                        points: result.points,
                        table: result.suggestedSalaryStructure
                    });
                    setIsDemo(false);
                }
            })
            .catch(() => {
                console.log('Mantendo modo DEMO - Ambiente de teste ativo.');
            });
    }, []);

    const steps = [
        { id: 1, title: 'Estrutura de Cargos', icon: <Layers size={18} />, status: 'DONE' },
        { id: 2, title: 'Diagnóstico', icon: <Target size={18} />, status: 'DONE' },
        { id: 3, title: 'Cálculo Tabela', icon: <Calculator size={18} />, status: 'ACTIVE' },
        { id: 4, title: 'Estrutura Salarial', icon: <TrendingUp size={18} />, status: 'TODO' },
    ];

    return (
        <div style={{ maxWidth: 1200 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
                    Estrutura Salarial
                    {isDemo && <span style={{ marginLeft: 12, fontSize: 12, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4, verticalAlign: 'middle', fontWeight: 600 }}>DEMO MODE</span>}
                </h1>
                <p style={{ color: '#64748b' }}>Definição de grades, amplitudes e degraus de carreira.</p>
            </div>

            <div style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {steps.map((step) => (
                    <div
                        key={step.id}
                        style={{
                            padding: '16px 20px',
                            borderRadius: 12,
                            background: step.status === 'ACTIVE' ? '#4f46e5' : 'white',
                            color: step.status === 'ACTIVE' ? 'white' : '#1e293b',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            transition: '0.2s',
                            boxShadow: step.status === 'ACTIVE' ? '0 10px 15px -3px rgba(79, 70, 229, 0.2)' : 'none'
                        }}
                        onClick={() => setActiveStep(step.id)}
                    >
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: step.status === 'ACTIVE' ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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

            <div className="grid-2">
                {/* Lado Esquerdo: Motor Estatístico (Regressão) */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Regressão Linear (R²)</h3>
                            <p style={{ fontSize: 13, color: '#64748b' }}>Consistência da Estrutura Atual</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#4f46e5' }}>{data.regression.rSquared.toFixed(2)}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: data.regression.rSquared > 0.8 ? '#10b981' : '#f59e0b', background: data.regression.rSquared > 0.8 ? '#f0fdf4' : '#fffbeb', padding: '2px 8px', borderRadius: 4 }}>
                                {data.regression.rSquared > 0.8 ? 'EXCELENTE' : 'CONSISTENTE'}
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 300, marginBottom: 20 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data.points}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="grade" label={{ value: 'Grades', position: 'bottom', fontSize: 12 }} />
                                <YAxis label={{ value: 'Salário (R$)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Scatter name="Salário Real" dataKey="salary" fill="#94a3b8" />
                                <Line name="Tendência (Fórm. Carolina)" type="monotone" dataKey="predicted" stroke="#4f46e5" strokeWidth={3} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{ padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <Info size={20} color="#4f46e5" />
                            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                                A reta indica que para cada evolução de <strong>Grade</strong>, há um aumento médio de <strong>15.2%</strong>. A dispersão atual está baixa, indicando uma política salarial bem aplicada.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Dashboard de Controles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="card">
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Configuração da Tabela</h3>

                        <div style={{ display: 'grid', gap: 20 }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                                    <span>Range Spread (Amplitude)</span>
                                    <span style={{ color: '#4f46e5' }}>40%</span>
                                </div>
                                <input type="range" style={{ width: '100%' }} defaultValue={40} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>QUANTIDADE DE STEPS</label>
                                    <select style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <option>5 Steps (A-E)</option>
                                        <option>7 Steps (A-G)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>TIPO DE TABELA</label>
                                    <select style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <option>CLT (Mensal)</option>
                                        <option>PJ (Valor Hora)</option>
                                    </select>
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <RefreshCw size={18} />
                                Recalcular Estrutura
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ background: '#111827', color: 'white' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Insight Estratégico</h3>
                        <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
                            Baseado no benchmark da <strong>Construção Civil</strong>, sua curva de Midpoint (P50) está <strong>8% acima</strong> do mercado regional para cargos operacionais.
                        </p>
                        <button style={{ background: 'none', border: 'none', color: '#6366f1', padding: 0, cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Ver detalhes do benchmark <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela de Estrutura Salarial (Passo 4) */}
            <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Passo 4: Grade de Salários Sugerida</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>GRADE</th>
                                <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>STEP A (Mín)</th>
                                <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>STEP B</th>
                                <th style={{ padding: '12px 16px', fontSize: 13, color: '#4f46e5' }}>STEP C (Mid)</th>
                                <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>STEP D</th>
                                <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>STEP E (Máx)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.table.map((row: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px', fontWeight: 800, color: '#1e293b' }}>{row.grade}</td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: 14 }}>R$ {row.steps[0]?.value || row.steps[0]}</td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: 14 }}>R$ {row.steps[1]?.value || row.steps[1]}</td>
                                    <td style={{ padding: '16px', color: '#1e293b', fontWeight: 700, background: '#f5f7ff' }}>R$ {row.steps[2]?.value || row.steps[2]}</td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: 14 }}>R$ {row.steps[3]?.value || row.steps[3]}</td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: 14 }}>R$ {row.steps[4]?.value || row.steps[4]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

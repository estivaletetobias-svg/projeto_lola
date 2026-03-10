'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { Download, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';

export default function DiagnosticsPage() {
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Pegar snapshots
                const host = window.location.hostname;
                const snapRes = await fetch(`http://${host}:3000/payroll/snapshots`);
                const snapshots = await snapRes.json();

                if (snapshots.length === 0) {
                    setError('Nenhuma folha de pagamento encontrada. Por favor, faça o upload de uma folha primeiro na aba Snapshots.');
                    setLoading(false);
                    return;
                }

                const latest = snapshots[0];
                setSnapshot(latest);

                // 2. Pegar análise do Salary Engine
                const analysisRes = await fetch(`http://${host}:3000/salary-engine/analyze/${latest.id}`);
                const analysisData = await analysisRes.json();

                if (analysisData.status === 'error') {
                    setError(analysisData.message || 'Erro ao processar inteligência salarial.');
                    setLoading(false);
                    return;
                }

                setAnalysis(analysisData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching diagnostics:', err);
                setError('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin" size={48} color="#4f46e5" />
                <p style={{ marginTop: 16, color: '#64748b' }}>Processando Inteligência Salarial...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Aviso</h3>
                <p style={{ color: '#64748b', marginBottom: 24 }}>{error}</p>
                <a href="/snapshots" className="btn btn-primary">Ir para Snapshots</a>
            </div>
        );
    }

    // 1. Preparar dados para o gráfico de Dispersão (Scatter + Line)
    const scatterData = (analysis.mappedEmployees || []).map((emp: any) => ({
        grade: emp.grade,
        salary: emp.salary,
        name: emp.name,
        title: emp.jobTitle
    }));

    // Criar a linha de tendência (reta de regressão)
    const curveData = (analysis.suggestedSalaryStructure || []).map((s: any) => ({
        grade: parseInt(s.grade.replace('G', '')),
        salary: s.midpoint // Mudamos para 'salary' para bater com a dataKey do YAxis
    })).sort((a: any, b: any) => a.grade - b.grade);

    // 2. Calcular distribuição real por Quartis
    const calculatePositioning = () => {
        let p25 = 0, p50 = 0, p75 = 0, pAbove = 0;

        (analysis.mappedEmployees || []).forEach((emp: any) => {
            const midpoint = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${emp.grade}`)?.midpoint || 0;
            if (midpoint === 0) return;

            const gap = (emp.salary / midpoint) - 1;

            if (gap < -0.10) p25++; // Mais de 10% abaixo
            else if (gap < 0.05) p50++; // Entre -10% e +5% (Alinhado)
            else if (gap < 0.20) p75++; // Entre 5% e 20% (Agressivo)
            else pAbove++;
        });

        return [
            { name: 'Abaixo (-10%)', value: p25, color: '#f43f5e' },
            { name: 'Alinhado', value: p50, color: '#10b981' },
            { name: 'Agressivo (>5%)', value: p75, color: '#4f46e5' },
            { name: 'Acima (>20%)', value: pAbove, color: '#0f172a' },
        ];
    };

    const realPositionData = calculatePositioning();

    return (
        <div style={{ paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Diagnóstico de Remuneração</h1>
                    <p style={{ color: '#64748b' }}>Snapshot: <strong>{new Date(snapshot.period_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={18} /> Recarregar Análise
                    </button>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={18} /> Exportar Relatório
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Aderência da Curva (R²)</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: analysis.diagnostics.regressionCurve.rSquared > 0.8 ? '#10b981' : '#f59e0b' }}>
                        {(analysis.diagnostics.regressionCurve.rSquared * 100).toFixed(1)}%
                    </div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Diagnóstico Lola</p>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{analysis.diagnostics.recommendation}</div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Colaboradores</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>{analysis.diagnostics.pointsCount}</div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Gap Médio Mercado</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: (analysis.diagnostics.avgGap || 0) < 0 ? '#f43f5e' : '#10b981' }}>
                        {analysis.diagnostics.avgGap ? (analysis.diagnostics.avgGap).toFixed(1) : '0.0'}%
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Gráfico de Dispersão e Equilíbrio</h3>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Pontos: Seus Colaboradores | Linha: Midpoint Mercado</div>
                    </div>
                    <div style={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    type="number"
                                    dataKey="grade"
                                    name="Grade"
                                    unit=""
                                    domain={['auto', 'auto']}
                                    label={{ value: 'Grade (Complexidade)', position: 'insideBottom', offset: -10 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="salary"
                                    name="Salário"
                                    unit="R$"
                                    label={{ value: 'Salário Base', angle: -90, position: 'insideLeft' }}
                                />
                                <ZAxis type="number" range={[100, 100]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            // Se for ponto de funcionário
                                            if (data.name) {
                                                return (
                                                    <div className="card" style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{data.name}</div>
                                                        <div style={{ fontSize: 11, color: '#64748b' }}>{data.title}</div>
                                                        <div style={{ fontSize: 12, marginTop: 4 }}>
                                                            <span style={{ fontWeight: 600 }}>R$ {data.salary?.toLocaleString()}</span>
                                                            <span style={{ color: '#64748b', marginLeft: 4 }}>(Grade {data.grade})</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                        return null;
                                    }}
                                />

                                {/* A Linha da Reta de Regressão */}
                                <Scatter
                                    name="Tendência Mercado"
                                    data={curveData}
                                    fill="#4f46e5"
                                    line={{ stroke: '#4f46e5', strokeWidth: 4 }}
                                    shape={() => null}
                                />

                                {/* Os Pontos Reais */}
                                <Scatter
                                    name="Seus Colaboradores"
                                    data={scatterData}
                                    fill="#f43f5e"
                                />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Tabela Salarial de Referência</h3>
                    <div style={{ height: 400, overflowY: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Grade</th>
                                    <th style={{ textAlign: 'right', padding: 8 }}>Midpoint</th>
                                    <th style={{ textAlign: 'right', padding: 8 }}>Min</th>
                                    <th style={{ textAlign: 'right', padding: 8 }}>Max</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.suggestedSalaryStructure.map((row: any) => (
                                    <tr key={row.grade} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: 8, fontWeight: 600 }}>{row.grade}</td>
                                        <td style={{ padding: 8, textAlign: 'right' }}>R$ {row.midpoint.toLocaleString()}</td>
                                        <td style={{ padding: 8, textAlign: 'right', color: '#64748b' }}>R$ {row.steps[0].value.toLocaleString()}</td>
                                        <td style={{ padding: 8, textAlign: 'right', color: '#64748b' }}>R$ {row.steps[row.steps.length - 1].value.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Posicionamento da Folha</h3>
                <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={realPositionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {realPositionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Pessoas Incluídas no Diagnóstico ({analysis.mappedEmployees?.length || 0})</h3>
                <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                    Lista de colaboradores que possuem um "De/Para" realizado e estão servindo de base para os cálculos acima.
                </p>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: 12 }}>Nome</th>
                                <th style={{ textAlign: 'left', padding: 12 }}>Cargo Padrão (Grade)</th>
                                <th style={{ textAlign: 'right', padding: 12 }}>Salário Atual</th>
                                <th style={{ textAlign: 'right', padding: 12 }}>Gap Mercado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analysis.mappedEmployees?.map((emp: any, i: number) => {
                                const marketP50 = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${emp.grade}`)?.midpoint || 0;
                                const gap = marketP50 > 0 ? ((emp.salary / marketP50) - 1) * 100 : 0;

                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: 12, fontWeight: 600 }}>{emp.name}</td>
                                        <td style={{ padding: 12 }}>{emp.jobTitle} (Grade {emp.grade})</td>
                                        <td style={{ padding: 12, textAlign: 'right' }}>R$ {emp.salary.toLocaleString()}</td>
                                        <td style={{ padding: 12, textAlign: 'right', color: gap < 0 ? '#f43f5e' : '#10b981', fontWeight: 600 }}>
                                            {gap > 0 ? '+' : ''}{gap.toFixed(1)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

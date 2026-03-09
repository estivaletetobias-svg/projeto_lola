'use client';

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { Download, AlertTriangle, TrendingDown, Target, Loader2 } from 'lucide-react';

export default function DiagnosticsPage() {
    const [loading, setLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Pegar snapshots
                const snapRes = await fetch('http://localhost:3000/payroll/snapshots');
                const snapshots = await snapRes.json();

                if (snapshots.length === 0) {
                    setError('Nenhuma folha de pagamento encontrada. Por favor, faça o upload de uma folha primeiro na aba Snapshots.');
                    setLoading(false);
                    return;
                }

                const latest = snapshots[0];
                setSnapshot(latest);

                // 2. Pegar análise do Salary Engine
                const analysisRes = await fetch(`http://localhost:3000/salary-engine/analyze/${latest.id}`);
                const analysisData = await analysisRes.json();
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

    // Preparar dados para o gráfico de barras (Quartis)
    const positionData = [
        { name: 'P25 (Abaixo)', value: 12, color: '#f43f5e' },
        { name: 'P25-P50 (Alinhado)', value: 54, color: '#10b981' },
        { name: 'P50-P75 (Agressivo)', value: 28, color: '#4f46e5' },
        { name: 'P75+ (Acima)', value: 6, color: '#0f172a' },
    ];

    return (
        <div style={{ paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Diagnóstico de Remuneração</h1>
                    <p style={{ color: '#64748b' }}>Snapshot: <strong>{new Date(snapshot.period_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong></p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={18} /> Exportar Relatório
                </button>
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
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Cargos Avaliados</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>{analysis.diagnostics.pointsCount}</div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Média Global Gap</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f43f5e' }}>-8.4%</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 600 }}>Curva de Regressão Lola (Passo 3)</h3>
                        <div style={{ fontSize: 12, color: '#64748b' }}>Eixo X: Grades (Complexidade) | Eixo Y: Salário Base</div>
                    </div>
                    <div style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analysis.suggestedSalaryStructure}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="grade" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar name="Midpoint Sugerido" dataKey="midpoint" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Tabela Salarial Sugerida (Passo 4)</h3>
                    <div style={{ height: 350, overflowY: 'auto' }}>
                        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <th style={{ textAlign: 'left', padding: 8 }}>Grade</th>
                                    <th style={{ textAlign: 'right', padding: 8 }}>Midpoint</th>
                                    <th style={{ textAlign: 'right', padding: 8 }}>A (Min)</th>
                                    <th style={{ textAlign: 'right', padding: 8 }}>E (Max)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.suggestedSalaryStructure.map((row: any) => (
                                    <tr key={row.grade} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: 8, fontWeight: 600 }}>{row.grade}</td>
                                        <td style={{ padding: 8, textAlign: 'right' }}>R$ {row.midpoint.toLocaleString()}</td>
                                        <td style={{ padding: 8, textAlign: 'right', color: '#64748b' }}>R$ {row.steps[0].value.toLocaleString()}</td>
                                        <td style={{ padding: 8, textAlign: 'right', color: '#64748b' }}>R$ {row.steps[4].value.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Posicionamento Geral da Folha</h3>
                <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={positionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {positionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

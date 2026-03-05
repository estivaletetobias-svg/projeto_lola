'use client';

import { useState } from 'react';
import { Target, Zap, Shield, Save, Download } from 'lucide-react';

export default function MeritCyclePage() {
    const [budget, setBudget] = useState(50000);
    const [scenario, setScenario] = useState('BALANCED');

    return (
        <div style={{ maxWidth: 1000 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Simulador de Ciclo de Mérito</h1>
                    <p style={{ color: '#64748b' }}>Defina seu orçamento e gere cenários de ajuste automáticos.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Save size={18} /> Salvar Cenário
                    </button>
                    <button className="btn btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={18} /> Exportar XLSX
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32 }}>
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Configurações do Ciclo</h3>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Orçamento Total (R$)</label>
                        <input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <label style={{ fontSize: 13, fontWeight: 600 }}>Estratégia de Distribuição</label>
                        <button
                            className={`btn ${scenario === 'CONSERVATIVE' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScenario('CONSERVATIVE')}
                            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                            <Shield size={18} /> Conservador (abaixo P25)
                        </button>
                        <button
                            className={`btn ${scenario === 'BALANCED' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScenario('BALANCED')}
                            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                            <Target size={18} /> Equilibrado (abaixo P50)
                        </button>
                        <button
                            className={`btn ${scenario === 'AGRESSIVE' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setScenario('AGRESSIVE')}
                            style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
                        >
                            <Zap size={18} /> Agressivo (foco retenção)
                        </button>
                    </div>
                </div>

                <div>
                    <div className="card" style={{ marginBottom: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Resumo Simulação: {scenario}</h3>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 24, fontWeight: 700 }}>R$ 42.500 <span style={{ fontSize: 13, color: '#64748b' }}>consumido</span></div>
                                <div style={{ fontSize: 13, color: '#10b981' }}>85.0% do orçamento</div>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                                    <th style={{ padding: '12px 0', fontSize: 13, color: '#64748b' }}>Colaborador</th>
                                    <th style={{ padding: '12px 0', fontSize: 13, color: '#64748b' }}>Ação</th>
                                    <th style={{ padding: '12px 0', fontSize: 13, color: '#64748b' }}>Raise %</th>
                                    <th style={{ padding: '12px 0', fontSize: 13, color: '#64748b', textAlign: 'right' }}>Novo Salário</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { name: 'Ana Silva', type: 'Promoção', raise: 15.2, newSal: 14500 },
                                    { name: 'Beto Costa', type: 'Mérito', raise: 8.5, newSal: 9200 },
                                    { name: 'Carol Lima', type: 'Ajuste', raise: 4.2, newSal: 10500 },
                                    { name: 'Dani Melo', type: 'Mérito', raise: 6.0, newSal: 12400 },
                                ].map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 0', fontWeight: 600 }}>{row.name}</td>
                                        <td style={{ padding: '16px 0' }}><span style={{ padding: '4px 8px', borderRadius: 4, background: '#f1f5f9', fontSize: 11 }}>{row.type}</span></td>
                                        <td style={{ padding: '16px 0' }}>{row.raise}%</td>
                                        <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600 }}>R$ {row.newSal}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

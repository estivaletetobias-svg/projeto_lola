'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Download, AlertTriangle, TrendingDown, Target } from 'lucide-react';

const data = [
    { name: 'P25 (Abaixo)', value: 12, color: '#f43f5e' },
    { name: 'P25-P50 (Alinhado)', value: 54, color: '#10b981' },
    { name: 'P50-P75 (Agressivo)', value: 28, color: '#4f46e5' },
    { name: 'P75+ (Acima)', value: 6, color: '#0f172a' },
];

export default function DiagnosticsPage() {
    return (
        <div style={{ paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Diagnóstico de Remuneração</h1>
                    <p style={{ color: '#64748b' }}>Posicionamento da sua empresa em relação ao mercado (Brasil / Tecnologia / Médio Porte)</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={18} /> Exportar Relatório
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Média vs Mercado (P50)</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f43f5e' }}>-8.4%</div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Abaixo do P25</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#f43f5e' }}>12%</div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Eficiência da Folha</p>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>92%</div>
                </div>
                <div className="card">
                    <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Custo de Ajuste (P50)</p>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>R$ 14,2k <span style={{ fontSize: 13, color: '#64748b' }}>/mês</span></div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
                <div className="card">
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Posicionamento Geral</h3>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Top Gaps Individuais</h3>
                    <div style={{ display: 'grid', gap: 16 }}>
                        {[
                            { name: 'Ana Silva', role: 'Dev Sr', gap: -3400, percent: -22 },
                            { name: 'Beto Costa', role: 'Dev Pl', gap: -2100, percent: -18 },
                            { name: 'Carol Lima', role: 'PM Jr', gap: -1800, percent: -15 },
                            { name: 'Dani Melo', role: 'QA Sr', gap: -1200, percent: -10 },
                        ].map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #f1f5f9' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.role}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#f43f5e', fontWeight: 600 }}>R$ {p.gap}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.percent}% vs P50</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

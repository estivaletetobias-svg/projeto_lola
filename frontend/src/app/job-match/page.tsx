'use client';

import { Check, Edit2, AlertTriangle, Search } from 'lucide-react';

export default function JobMatchPage() {
    return (
        <div style={{ maxWidth: 1000 }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Mapeamento de Cargos</h1>
                <p style={{ color: '#64748b' }}>Revise as sugestões de cargos padronizados para garantir a acurácia do mercado.</p>
            </div>

            <div className="card" style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '0 8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Buscar colaborador ou cargo..."
                            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <button className="btn btn-secondary">Filtrar por Área</button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b' }}>Cargo Interno</th>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b' }}>Sugestão Padronizada</th>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b' }}>Confiança</th>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { internal: 'Engenheiro de Software I', std: 'Software Engineer I (Junior)', confidence: 95, status: 'HIGH' },
                            { internal: 'Analista de Sistemas Pleno', std: 'Software Engineer II (Pleno)', confidence: 82, status: 'HIGH' },
                            { internal: 'Gerente de Contas B2B', std: 'Account Executive', confidence: 64, status: 'MEDIUM' },
                            { internal: 'Coordenador Administrativo', std: 'Office Manager', confidence: 42, status: 'LOW' },
                        ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px 12px', fontWeight: 600 }}>{row.internal}</td>
                                <td style={{ padding: '16px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {row.std}
                                        <Edit2 size={12} style={{ color: '#94a3b8', cursor: 'pointer' }} />
                                    </div>
                                </td>
                                <td style={{ padding: '16px 12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 60, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                            <div style={{ width: `${row.confidence}%`, height: '100%', background: row.confidence > 80 ? '#10b981' : (row.confidence > 50 ? '#f59e0b' : '#ef4444') }}></div>
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 600 }}>{row.confidence}%</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12, background: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Check size={14} /> Aprovar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button className="btn btn-secondary">Anterior</button>
                <button className="btn btn-secondary">Próximo</button>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Check, Edit2, AlertTriangle, Search, Loader2 } from 'lucide-react';

export default function JobMatchPage() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [snapshotId, setSnapshotId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const host = window.location.hostname;

                // 1. Pegar último snapshot
                const snapRes = await fetch(`http://${host}:3000/payroll/snapshots`);
                const snapshots = await snapRes.json();

                if (snapshots.length === 0) {
                    setError('Nenhuma folha encontrada. Faça o upload primeiro.');
                    setLoading(false);
                    return;
                }
                const sid = snapshots[0].id;
                setSnapshotId(sid);

                // 2. Pegar catálogo de cargos
                const catalogRes = await fetch(`http://${host}:3000/job-match/catalog`);
                const catalogData = await catalogRes.json();
                setCatalog(catalogData);

                // 3. Pegar matches atuais
                const matchesRes = await fetch(`http://${host}:3000/job-match/${sid}`);
                const matchesData = await matchesRes.json();
                setEmployees(matchesData);

                setLoading(false);
            } catch (err) {
                console.error('Error fetching job match data:', err);
                setError('Erro de conexão com o servidor.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleApprove = async (employeeId: string, catalogId: string) => {
        try {
            const host = window.location.hostname;
            await fetch(`http://${host}:3000/job-match/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    snapshotId,
                    jobCatalogId: catalogId,
                    method: 'MANUAL_UI'
                }),
            });

            // Update local state to show as approved
            setEmployees(prev => prev.map(emp =>
                emp.employeeId === employeeId
                    ? { ...emp, match: { ...emp.match, job_catalog_id: catalogId, method: 'MANUAL_UI' } }
                    : emp
            ));
        } catch (err) {
            console.error('Error approving match:', err);
            alert('Erro ao salvar mapeamento.');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin" size={48} color="#4f46e5" />
                <p style={{ marginTop: 16, color: '#64748b' }}>Carregando Colaboradores...</p>
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

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 100 }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Mapeamento de Cargos</h1>
                <p style={{ color: '#64748b' }}>Revise as sugestões de cargos padronizados para garantir a acurácia do mercado.</p>
            </div>

            <div className="card" style={{ marginBottom: 32 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b' }}>Colaborador / Cargo Interno</th>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b' }}>Sugestão Padronizada (Grades)</th>
                            <th style={{ padding: '12px 12px', fontSize: 13, color: '#64748b', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px 12px' }}>
                                    <div style={{ fontWeight: 600 }}>{row.employeeName}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>{row.internalTitle}</div>
                                </td>
                                <td style={{ padding: '16px 12px' }}>
                                    <select
                                        defaultValue={row.match?.job_catalog_id || ''}
                                        onChange={(e) => handleApprove(row.employeeId, e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff' }}
                                    >
                                        <option value="">-- Selecione o Cargo Padrão --</option>
                                        {catalog.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.title_std} (Grade {cat.grade}) - {cat.family}
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' }}>
                                        {catalog.find(c => c.id === (row.match?.job_catalog_id))?.description || 'Nenhum cargo padrão selecionado.'}
                                    </div>
                                </td>

                                <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                    {row.match ? (
                                        <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                            <Check size={16} /> Salvo
                                        </span>
                                    ) : (
                                        <span style={{ color: '#f59e0b', fontSize: 12 }}>Pendente</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


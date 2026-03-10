'use client';

import { useState, useEffect } from 'react';
import { Check, AlertTriangle, Loader2, RefreshCw, Filter } from 'lucide-react';

export default function JobMatchPage() {
    const [loading, setLoading] = useState(true);
    const [snapshotId, setSnapshotId] = useState<string>('');
    const [employees, setEmployees] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'mapped'>('all');
    const [jobGroups, setJobGroups] = useState<any[]>([]);
    const [allEmployees, setAllEmployees] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const host = window.location.hostname;

                // 1. Pegar último snapshot
                const snapRes = await fetch(`http://${host}:3000/payroll/snapshots`);
                const snapshots = await snapRes.json();

                if (snapshots.length === 0) {
                    setError('Nenhuma folha encontrada.');
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
                const employeesData = await matchesRes.json();
                setAllEmployees(employeesData);

                // Agrupar por Cargo Interno 
                const groups: any = {};
                employeesData.forEach((emp: any) => {
                    const title = emp.internalTitle || 'Geral';
                    if (!groups[title]) {
                        groups[title] = {
                            title,
                            count: 0,
                            match: emp.match,
                            sampleEmployeeId: emp.employeeId,
                            employeeIds: []
                        };
                    }
                    groups[title].count++;
                    groups[title].employeeIds.push(emp.employeeId);
                });
                setJobGroups(Object.values(groups));
                setLoading(false);
            } catch (err) {
                console.error('Error fetching job match data:', err);
                setError('Erro de conexão.');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleBulkApprove = async (group: any, catalogId: string) => {
        setSaving(group.title);
        try {
            const host = window.location.hostname;
            await Promise.all(group.employeeIds.map((empId: string) =>
                fetch(`http://${host}:3000/job-match/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeId: empId,
                        snapshotId,
                        jobCatalogId: catalogId,
                        method: 'BULK_UI'
                    }),
                })
            ));

            setJobGroups(prev => prev.map(g =>
                g.title === group.title ? { ...g, match: catalogId ? { job_catalog_id: catalogId } : null } : g
            ));
            setAllEmployees(prev => prev.map(e => group.employeeIds.includes(e.employeeId) ? { ...e, match: catalogId ? { job_catalog_id: catalogId } : null } : e));

            setTimeout(() => setSaving(null), 800);
        } catch (err) {
            console.error('Error approving match:', err);
            setSaving(null);
            alert('Erro ao salvar.');
        }
    };

    const handleSingleApprove = async (empId: string, catalogId: string) => {
        setSaving(empId);
        try {
            const host = window.location.hostname;
            await fetch(`http://${host}:3000/job-match/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: empId,
                    snapshotId,
                    jobCatalogId: catalogId,
                    method: 'MANUAL_UI'
                }),
            });

            // Update local state for both views
            setAllEmployees(prev => prev.map(e => e.employeeId === empId ? { ...e, match: catalogId ? { job_catalog_id: catalogId } : null } : e));
            setJobGroups(prev => prev.map(g => g.employeeIds.includes(empId) ? { ...g, match: catalogId ? { job_catalog_id: catalogId } : null } : g));

            setTimeout(() => setSaving(null), 500);
        } catch (err) {
            console.error('Error approving single match:', err);
            setSaving(null);
            alert('Erro ao salvar.');
        }
    };


    const handleClearAll = async () => {
        if (!confirm('Deseja remover TODOS os cargos da análise?')) return;
        setLoading(true);
        try {
            const host = window.location.hostname;
            await Promise.all(allEmployees.map(emp =>
                fetch(`http://${host}:3000/job-match/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeId: emp.employeeId,
                        snapshotId,
                        jobCatalogId: '',
                        method: 'CLEAR_ALL'
                    }),
                })
            ));

            setAllEmployees(prev => prev.map(e => ({ ...e, match: null })));
            setJobGroups(prev => prev.map(g => ({ ...g, match: null })));
            setLoading(false);
        } catch (err) {
            setLoading(false);
            alert('Erro ao limpar.');
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
                <p style={{ color: '#64748b' }}>
                    Crie a correspondência entre os cargos da sua folha e os cargos padrão do mercado para habilitar o diagnóstico.
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
                        <button
                            onClick={() => setViewMode('grouped')}
                            style={{
                                padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600,
                                background: viewMode === 'grouped' ? '#fff' : 'transparent',
                                color: viewMode === 'grouped' ? '#1e293b' : '#64748b',
                                boxShadow: viewMode === 'grouped' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Agrupar por Cargo
                        </button>
                        <button
                            onClick={() => setViewMode('individual')}
                            style={{
                                padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600,
                                background: viewMode === 'individual' ? '#fff' : 'transparent',
                                color: viewMode === 'individual' ? '#1e293b' : '#64748b',
                                boxShadow: viewMode === 'individual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Individual
                        </button>
                    </div>

                    <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => setFilter('all')}
                            className={filter === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                            Tudo ({viewMode === 'grouped' ? jobGroups.length : allEmployees.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={filter === 'pending' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                            Pendentes ({viewMode === 'grouped' ? jobGroups.filter(g => !g.match?.job_catalog_id).length : allEmployees.filter(e => !e.match?.job_catalog_id).length})
                        </button>
                        <button
                            onClick={() => setFilter('mapped')}
                            className={filter === 'mapped' ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ padding: '8px 16px', fontSize: 13 }}
                        >
                            Mapeados ({viewMode === 'grouped' ? jobGroups.filter(g => g.match?.job_catalog_id).length : allEmployees.filter(e => e.match?.job_catalog_id).length})
                        </button>
                    </div>

                    <button
                        onClick={handleClearAll}
                        style={{ border: '1px solid #e11d48', color: '#e11d48', background: 'transparent', padding: '8px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                    >
                        Limpar Tudo (Sair da Análise)
                    </button>
                </div>

                <a href="/diagnostics" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={18} /> Ver Diagnóstico Atualizado
                </a>
            </div>

            {viewMode === 'grouped' && jobGroups.length === 1 && jobGroups[0].title === 'Geral' && (
                <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 20, display: 'flex', gap: 12 }}>
                    <AlertTriangle color="#d97706" />
                    <div>
                        <div style={{ fontWeight: 700, color: '#92400e' }}>Aviso: Cargos não identificados</div>
                        <div style={{ fontSize: 14, color: '#b45309' }}>
                            Todos os colaboradores foram importados como "Geral". Isso acontece quando o sistema não encontra as colunas de cargo na sua planilha.
                            Tente subir o arquivo novamente ou mapeie individualmente.
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                                {viewMode === 'grouped' ? 'Cargo na Sua Folha' : 'Colaborador'}
                            </th>
                            {viewMode === 'individual' && (
                                <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cargo Folha</th>
                            )}
                            <th style={{ textAlign: 'left', padding: '16px 12px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Correspondência de Mercado (Padrão Lola)</th>
                            <th style={{ textAlign: 'right', padding: '16px 12px', fontSize: 13, fontWeight: 600, color: '#64748b' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewMode === 'grouped' ? jobGroups
                            .filter(group => {
                                const isMapped = !!group.match?.job_catalog_id;
                                if (filter === 'pending') return !isMapped;
                                if (filter === 'mapped') return isMapped;
                                return true;
                            })
                            .map((group) => (
                                <tr key={group.title} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '24px 12px' }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{group.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>{group.count} colaboradores vinculados</div>
                                    </td>
                                    <td style={{ padding: '16px 12px' }}>
                                        <select
                                            value={group.match?.job_catalog_id || ''}
                                            onChange={(e) => handleBulkApprove(group, e.target.value)}
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: 8,
                                                border: group.match?.job_catalog_id ? '1px solid #10b981' : '1px solid #cbd5e1',
                                                background: group.match?.job_catalog_id ? '#f0fdf4' : '#fff',
                                                fontWeight: group.match?.job_catalog_id ? 600 : 400
                                            }}
                                        >
                                            <option value="">-- Vincular a um Cargo de Mercado --</option>
                                            {catalog.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.title_std} (Grade {cat.grade})
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                        {saving === group.title ? (
                                            <span style={{ color: '#4f46e5', fontWeight: 600 }} className="animate-pulse">Salvando...</span>
                                        ) : group.match?.job_catalog_id ? (
                                            <span style={{ color: '#10b981', fontWeight: 700 }}>PRONTO</span>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>Aguardando</span>
                                        )}
                                    </td>
                                </tr>
                            )) :
                            allEmployees
                                .filter(row => {
                                    const isMapped = !!(row.match && row.match.job_catalog_id);
                                    if (filter === 'pending') return !isMapped;
                                    if (filter === 'mapped') return isMapped;
                                    return true;
                                })
                                .map((row) => (
                                    <tr key={row.employeeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: 600 }}>{row.employeeName}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                                                {row.internalTitle || 'Geral'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <select
                                                value={row.match?.job_catalog_id || ''}
                                                onChange={(e) => handleSingleApprove(row.employeeId, e.target.value)}
                                                style={{
                                                    width: '100%', padding: '8px', borderRadius: 6,
                                                    border: row.match?.job_catalog_id ? '1px solid #10b981' : '1px solid #e2e8f0',
                                                    background: row.match?.job_catalog_id ? '#f0fdf4' : '#fff'
                                                }}
                                            >
                                                <option value="">-- Selecione o Cargo Padrão --</option>
                                                {catalog.map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.title_std} (Grade {cat.grade})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            {saving === row.employeeId ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : row.match?.job_catalog_id ? (
                                                <Check size={16} color="#10b981" />
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: 12 }}>Pendente</span>
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

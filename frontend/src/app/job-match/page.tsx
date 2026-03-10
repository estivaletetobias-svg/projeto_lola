'use client';

import { useState, useEffect } from 'react';
import {
    Check, CheckCircle2, AlertTriangle, Loader2,
    RefreshCw, Zap, ChevronDown, ChevronUp, X, Search
} from 'lucide-react';

const LEVEL_LABELS: Record<string, string> = {
    ANY: 'Indiferente', JUNIOR: 'Júnior', PLENO: 'Pleno',
    SENIOR: 'Sênior', INTERN: 'Estagiário',
    COORD: 'Coordenador', MANAGER: 'Gerente', DIRECTOR: 'Diretor',
};

const CONFIDENCE_COLOR = (c: number) =>
    c >= 60 ? '#10b981' : c >= 30 ? '#f59e0b' : '#ef4444';

const CONFIDENCE_LABEL = (c: number) =>
    c >= 60 ? 'Alta' : c >= 30 ? 'Média' : 'Baixa';

export default function JobMatchPage() {
    const [loading, setLoading] = useState(true);
    const [snapshotId, setSnapshotId] = useState('');
    const [groups, setGroups] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [search, setSearch] = useState<Record<string, string>>({});
    const [autoApproving, setAutoApproving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const host = window.location.hostname;
            const snapsRes = await fetch(`http://${host}:3000/payroll/snapshots`);
            const snapshots = await snapsRes.json();

            if (!snapshots?.length) {
                setError('Nenhuma folha encontrada. Faça o upload primeiro.');
                setLoading(false);
                return;
            }

            const sid = snapshots[0].id;
            setSnapshotId(sid);

            const [suggestRes, catalogRes] = await Promise.all([
                fetch(`http://${host}:3000/job-match/suggest/${sid}`),
                fetch(`http://${host}:3000/job-match/catalog`),
            ]);

            setGroups(await suggestRes.json());
            setCatalog(await catalogRes.json());
        } catch {
            setError('Erro ao conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (group: any, jobCatalogId: string) => {
        setSaving(group.internalTitle);
        try {
            const host = window.location.hostname;
            for (const empId of group.employeeIds) {
                await fetch(`http://${host}:3000/job-match/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeId: empId,
                        snapshotId,
                        jobCatalogId,
                        method: 'MANUAL',
                    })
                });
            }
            await fetchData();
        } finally {
            setSaving(null);
            setExpanded(null);
        }
    };

    const handleRemove = async (group: any) => {
        setSaving(group.internalTitle);
        try {
            const host = window.location.hostname;
            for (const empId of group.employeeIds) {
                await fetch(`http://${host}:3000/job-match/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        employeeId: empId,
                        snapshotId,
                        jobCatalogId: '',
                    })
                });
            }
            await fetchData();
        } finally {
            setSaving(null);
        }
    };

    const handleAutoApproveAll = async () => {
        setAutoApproving(true);
        try {
            const host = window.location.hostname;
            const res = await fetch(`http://${host}:3000/job-match/auto-approve/${snapshotId}`, { method: 'POST' });
            const result = await res.json();
            alert(`✅ ${result.approved} cargos aprovados automaticamente de ${result.total} total.`);
            await fetchData();
        } finally {
            setAutoApproving(false);
        }
    };

    const pending = groups.filter(g => !g.existingMatch);
    const mapped = groups.filter(g => g.existingMatch);
    const totalEmployees = groups.reduce((s, g) => s + g.count, 0);

    const filteredCatalog = (title: string) => {
        const q = (search[title] || '').toLowerCase();
        if (!q) return catalog.slice(0, 8);
        return catalog
            .filter(c => c.title_std.toLowerCase().includes(q) || (LEVEL_LABELS[c.level] || '').toLowerCase().includes(q))
            .slice(0, 10);
    };

    return (
        <div style={{ maxWidth: 1000, paddingBottom: 80 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Mapeamento de Cargos</h1>
                    <p style={{ color: '#64748b' }}>
                        A Carolina sugere o cargo equivalente de mercado — você só valida.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={fetchData}
                        style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}
                    >
                        <RefreshCw size={15} /> Atualizar
                    </button>
                    {pending.length > 0 && (
                        <button
                            onClick={handleAutoApproveAll}
                            disabled={autoApproving}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            {autoApproving ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                            Aprovar Sugestões Automáticas
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
                    <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
                    <p>Gerando sugestões inteligentes...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                    <AlertTriangle size={48} color="#fbbf24" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#64748b', fontSize: 15 }}>{error}</p>
                    <a href="/snapshots" style={{ color: '#4f46e5', fontWeight: 600, marginTop: 16, display: 'block' }}>→ Ir para Folha de Pagamento</a>
                </div>
            ) : (
                <>
                    {/* Resumo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Colaboradores', value: totalEmployees, color: '#4f46e5', bg: '#eef2ff' },
                            { label: 'Cargos mapeados', value: mapped.length, color: '#10b981', bg: '#f0fdf4' },
                            { label: 'Aguardando validação', value: pending.length, color: pending.length > 0 ? '#f59e0b' : '#10b981', bg: pending.length > 0 ? '#fffbeb' : '#f0fdf4' },
                        ].map(stat => (
                            <div key={stat.label} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${stat.color}` }}>
                                <div style={{ fontSize: 36, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Lista de grupos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {groups.map((group) => {
                            const isExpanded = expanded === group.internalTitle;
                            const isSaving = saving === group.internalTitle;
                            const topSuggestion = group.suggestions[0];

                            return (
                                <div
                                    key={group.internalTitle}
                                    className="card"
                                    style={{
                                        padding: 0, overflow: 'hidden',
                                        border: group.existingMatch
                                            ? '1px solid #d1fae5'
                                            : topSuggestion?.confidence >= 60
                                                ? '1px solid #fde68a'
                                                : '1px solid #e2e8f0'
                                    }}
                                >
                                    {/* Cabeçalho do grupo */}
                                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>

                                        {/* Status Icon */}
                                        <div style={{ flexShrink: 0 }}>
                                            {group.existingMatch ? (
                                                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircle2 size={22} color="#10b981" />
                                                </div>
                                            ) : (
                                                <div style={{ width: 40, height: 40, borderRadius: 20, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <AlertTriangle size={22} color="#f59e0b" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Título Interno */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                                                {group.internalTitle}
                                                <span style={{
                                                    marginLeft: 8, fontSize: 11, fontWeight: 600,
                                                    background: '#f1f5f9', color: '#64748b',
                                                    padding: '2px 6px', borderRadius: 4
                                                }}>
                                                    {group.count} colaborador{group.count > 1 ? 'es' : ''}
                                                </span>
                                            </div>

                                            {group.existingMatch ? (
                                                <div style={{ fontSize: 13, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span>→ </span>
                                                    <strong>{group.existingMatch.jobTitle}</strong>
                                                    <span style={{ color: '#94a3b8', fontWeight: 400 }}>
                                                        · {LEVEL_LABELS[group.existingMatch.method === 'AUTO_SUGGEST' ? '' : ''] || ''}
                                                    </span>
                                                    {group.existingMatch.method === 'AUTO_SUGGEST' && (
                                                        <span style={{ fontSize: 10, background: '#dbeafe', color: '#2563eb', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>AUTO</span>
                                                    )}
                                                </div>
                                            ) : topSuggestion ? (
                                                <div style={{ fontSize: 13, color: '#64748b' }}>
                                                    Sugestão: <strong style={{ color: CONFIDENCE_COLOR(topSuggestion.confidence) }}>{topSuggestion.jobTitle}</strong>
                                                    {' '}
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700,
                                                        color: CONFIDENCE_COLOR(topSuggestion.confidence),
                                                        background: CONFIDENCE_COLOR(topSuggestion.confidence) + '20',
                                                        padding: '1px 6px', borderRadius: 4
                                                    }}>
                                                        {CONFIDENCE_LABEL(topSuggestion.confidence)} ({topSuggestion.confidence}%)
                                                    </span>
                                                </div>
                                            ) : (
                                                <div style={{ fontSize: 13, color: '#94a3b8' }}>Nenhuma sugestão encontrada — selecione manualmente</div>
                                            )}
                                        </div>

                                        {/* Ações */}
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                                            {!group.existingMatch && topSuggestion && (
                                                <button
                                                    onClick={() => handleApprove(group, topSuggestion.jobCatalogId)}
                                                    disabled={!!isSaving}
                                                    style={{
                                                        padding: '8px 16px', borderRadius: 8, border: 'none',
                                                        background: '#10b981', color: 'white',
                                                        fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: 6
                                                    }}
                                                >
                                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                    Validar
                                                </button>
                                            )}
                                            {group.existingMatch && (
                                                <button
                                                    onClick={() => handleRemove(group)}
                                                    disabled={!!isSaving}
                                                    style={{
                                                        padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca',
                                                        background: 'white', color: '#ef4444',
                                                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                                    }}
                                                >
                                                    <X size={12} /> Remover
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setExpanded(isExpanded ? null : group.internalTitle)}
                                                style={{ padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                                            >
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Painel expandido */}
                                    {isExpanded && (
                                        <div style={{ borderTop: '1px solid #f1f5f9', padding: '20px', background: '#fafbff' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                                {/* Sugestões da IA */}
                                                {group.suggestions.length > 0 && (
                                                    <div>
                                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                                                            🤖 Sugestões da Carolina
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            {group.suggestions.map((s: any) => (
                                                                <div
                                                                    key={s.jobCatalogId}
                                                                    onClick={() => handleApprove(group, s.jobCatalogId)}
                                                                    style={{
                                                                        padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
                                                                        background: 'white', cursor: 'pointer', display: 'flex',
                                                                        justifyContent: 'space-between', alignItems: 'center',
                                                                        transition: 'all 0.15s'
                                                                    }}
                                                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#6366f1'; (e.currentTarget as HTMLElement).style.background = '#eef2ff'; }}
                                                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = 'white'; }}
                                                                >
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.jobTitle}</div>
                                                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                                                            {LEVEL_LABELS[s.level] || s.level} · Grade {s.grade}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ textAlign: 'right' }}>
                                                                        <div style={{
                                                                            fontSize: 13, fontWeight: 800,
                                                                            color: CONFIDENCE_COLOR(s.confidence)
                                                                        }}>
                                                                            {s.confidence}%
                                                                        </div>
                                                                        <div style={{ fontSize: 10, color: '#94a3b8' }}>confiança</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Busca manual */}
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                                                        🔍 Busca Manual
                                                    </div>
                                                    <div style={{ position: 'relative', marginBottom: 10 }}>
                                                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                        <input
                                                            placeholder="Buscar no catálogo..."
                                                            value={search[group.internalTitle] || ''}
                                                            onChange={e => setSearch(prev => ({ ...prev, [group.internalTitle]: e.target.value }))}
                                                            style={{ width: '100%', padding: '8px 8px 8px 30px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                                                        />
                                                    </div>
                                                    <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        {filteredCatalog(group.internalTitle).map((job: any) => (
                                                            <div
                                                                key={job.id}
                                                                onClick={() => handleApprove(group, job.id)}
                                                                style={{
                                                                    padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                                                                    background: 'white', cursor: 'pointer', fontSize: 13,
                                                                    display: 'flex', justifyContent: 'space-between'
                                                                }}
                                                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eef2ff'; }}
                                                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
                                                            >
                                                                <span style={{ fontWeight: 600 }}>{job.title_std}</span>
                                                                <span style={{ color: '#94a3b8', fontSize: 11 }}>{LEVEL_LABELS[job.level]} · G{job.grade}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {groups.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: 20, fontWeight: 700 }}>Tudo mapeado!</h3>
                            <p style={{ color: '#64748b' }}>Acesse o Diagnóstico para ver os resultados.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

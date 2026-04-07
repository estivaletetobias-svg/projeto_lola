'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, CheckCircle2, AlertTriangle, Loader2,
    RefreshCw, Zap, ChevronDown, ChevronUp, X, Search,
    Sparkles, UserCheck, BarChart3, TrendingUp, Activity,
    Target, BrainCircuit, LayoutGrid, ListChecks
} from 'lucide-react';
import Link from 'next/link';
import { getBackendUrl } from '../api-config';

const LEVEL_LABELS: Record<string, string> = {
    ANY: 'Indiferente', JUNIOR: 'Júnior', PLENO: 'Pleno',
    SENIOR: 'Sênior', INTERN: 'Estagiário',
    COORD: 'Coordenador', MANAGER: 'Gerente', DIRECTOR: 'Diretor',
};

const CONFIDENCE_COLOR = (c: number) =>
    c >= 80 ? '#10b981' : c >= 50 ? '#f59e0b' : '#ef4444';

const CONFIDENCE_LABEL = (c: number) =>
    c >= 80 ? 'Alta Confiança' : c >= 50 ? 'Validar Médio' : 'Revisão Crítica';

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
            const baseUrl = getBackendUrl();
            const snapsRes = await safeFetch(`${baseUrl}/payroll/snapshots`);
            const snapshots = await snapsRes.json();

            if (!snapshots?.length) {
                setError('Nenhuma folha encontrada. Faça o upload primeiro.');
                setLoading(false);
                return;
            }

            const sid = snapshots[0].id;
            setSnapshotId(sid);

            const [suggestRes, catalogRes] = await Promise.all([
                safeFetch(`${baseUrl}/job-match/suggest/${sid}`),
                safeFetch(`${baseUrl}/job-match/catalog`),
            ]);

            setGroups(await suggestRes.json());
            setCatalog(await catalogRes.json());
        } catch (err) {
            setError('Erro ao conectar ao servidor backend.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (group: any, jobCatalogId: string) => {
        setSaving(group.internalTitle);
        try {
            const baseUrl = getBackendUrl();
            for (const empId of group.employeeIds) {
                await safeFetch(`${baseUrl}/job-match/approve`, {
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
            // Update local state for instant feedback
            setGroups(prev => prev.map(g => 
                g.internalTitle === group.internalTitle 
                ? { ...g, existingMatch: { jobTitle: catalog.find(c => c.id === jobCatalogId)?.title_std } } 
                : g
            ));
            await fetchData();
        } finally {
            setSaving(null);
            setExpanded(null);
        }
    };

    const handleRemove = async (group: any) => {
        setSaving(group.internalTitle);
        try {
            const baseUrl = getBackendUrl();
            for (const empId of group.employeeIds) {
                await safeFetch(`${baseUrl}/job-match/approve`, {
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
            const baseUrl = getBackendUrl();
            await safeFetch(`${baseUrl}/job-match/auto-approve/${snapshotId}`, { method: 'POST' });
            await fetchData();
        } finally {
            setAutoApproving(false);
        }
    };

    const pending = groups.filter(g => !g.existingMatch);
    const mappedCount = groups.filter(g => g.existingMatch).length;
    const totalEmployees = groups.reduce((s, g) => s + g.count, 0);

    const filteredCatalog = (title: string) => {
        const q = (search[title] || '').toLowerCase();
        if (!q) return catalog.slice(0, 5);
        return catalog
            .filter(c => c.title_std.toLowerCase().includes(q) || (LEVEL_LABELS[c.level] || '').toLowerCase().includes(q))
            .slice(0, 5);
    };

    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <motion.div initial="hidden" animate="show" variants={containerVars} style={{ maxWidth: 1200, paddingBottom: 100 }}>
            {/* Header Strategy */}
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <div style={{ padding: '4px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BrainCircuit size={14} /> AI Mapping Engine Activated
                      </div>
                  </div>
                  <h1 style={{ fontSize: 42, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Mapeamento de Cargos & <br/>
                    <span style={{ color: '#64748b' }}>Curadoria de Dados.</span>
                  </h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchData} className="btn" style={{ padding: '12px 20px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={16} /> Atualizar
                    </button>
                    {pending.length > 0 && (
                        <button onClick={handleAutoApproveAll} disabled={autoApproving} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(79,70,229,0.1)' }}>
                            {autoApproving ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                            Aprovação Automática ({pending.length})
                        </button>
                    )}
                </div>
            </motion.div>

            {loading ? (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
                    <Loader2 size={48} className="animate-spin" color="#4f46e5" />
                    <p style={{ fontWeight: 600, color: '#64748b' }}>Sincronizando cargos internos com catálogo global...</p>
                </div>
            ) : error ? (
                <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
                    <AlertTriangle size={64} color="#f59e0b" style={{ margin: '0 auto 24px' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Ação Necessária</h2>
                    <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>{error}</p>
                    <Link href="/snapshots" className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: 14 }}>Realizar Novo Upload</Link>
                </motion.div>
            ) : (
                <>
                    {/* Stats Dashboard */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
                        {[
                            { label: 'Colaboradores no Snapshot', value: totalEmployees, icon: <UserCheck />, color: '#4f46e5' },
                            { label: 'Equivalências Mapeadas', value: mappedCount, icon: <LayoutGrid />, color: '#10b981' },
                            { label: 'Cargos Pendentes', value: pending.length, icon: <Target />, color: pending.length > 0 ? '#ef4444' : '#10b981' },
                        ].map((stat, idx) => (
                            <motion.div 
                                key={stat.label}
                                className="card"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{ padding: 32, position: 'relative', overflow: 'hidden' }}
                            >
                                <div style={{ marginBottom: 16, color: '#94a3b8' }}>{stat.icon}</div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{stat.label}</div>
                                <div style={{ fontSize: 36, fontWeight: 900, color: '#1e293b' }}>{stat.value}</div>
                                <div style={{ height: 4, width: '100%', background: '#334155', borderRadius: 2, marginTop: 20, overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: idx === 1 ? (mappedCount/groups.length * 100) + '%' : '100%' }}
                                        style={{ height: '100%', background: stat.color }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mapping Hub */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <AnimatePresence mode="popLayout">
                            {groups.map((group, idx) => {
                                const isExpanded = expanded === group.internalTitle;
                                const isSaving = saving === group.internalTitle;
                                const topSuggestion = group.suggestions[0];

                                return (
                                    <motion.div
                                        key={group.internalTitle}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        style={{
                                            background: 'white',
                                            borderRadius: 20,
                                            border: '1px solid',
                                            borderColor: isExpanded ? '#4f46e530' : group.existingMatch ? '#10b98120' : '#334155',
                                            boxShadow: isExpanded ? '0 20px 40px rgba(79,70,229,0.06)' : '0 2px 4px rgba(0,0,0,0.02)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
                                            {/* Matching Badge */}
                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: group.existingMatch ? '#10b98110' : '#1e293b', color: group.existingMatch ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {group.existingMatch ? <Check size={24} strokeWidth={3} /> : <Activity size={24} />}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                                                    <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1e293b' }}>{group.internalTitle}</h3>
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', background: '#334155', padding: '2px 10px', borderRadius: 20 }}>
                                                        {group.count} {group.count > 1 ? 'Colaboradores' : 'Colaborador'}
                                                    </span>
                                                </div>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {group.existingMatch ? (
                                                        <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Sparkles size={14} /> Mapeado Globalmente com: <span style={{ color: '#065f46', textDecoration: 'underline' }}>{group.existingMatch.jobTitle}</span>
                                                        </div>
                                                    ) : topSuggestion ? (
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                                                            Carolina AI sugere: <strong style={{ color: '#1e293b' }}>{topSuggestion.jobTitle}</strong>
                                                            <span style={{ marginLeft: 12, fontSize: 11, fontWeight: 800, color: CONFIDENCE_COLOR(topSuggestion.confidence), background: `${CONFIDENCE_COLOR(topSuggestion.confidence)}10`, padding: '2px 10px', borderRadius: 20 }}>
                                                                {topSuggestion.confidence}% {CONFIDENCE_LABEL(topSuggestion.confidence).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Aguardando análise detalhada de mercado</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 12 }}>
                                                {!group.existingMatch && topSuggestion && (
                                                    <button onClick={() => handleApprove(group, topSuggestion.jobCatalogId)} disabled={!!isSaving} className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: 12, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                        Validar
                                                    </button>
                                                )}
                                                {group.existingMatch && (
                                                    <button onClick={() => handleRemove(group)} disabled={!!isSaving} style={{ padding: '8px 16px', borderRadius: 10, background: 'white', border: '1px solid #fee2e2', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                                                        Redefinir
                                                    </button>
                                                )}
                                                <button onClick={() => setExpanded(isExpanded ? null : group.internalTitle)} style={{ padding: '10px', borderRadius: 12, background: isExpanded ? '#1e293b' : 'white', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    style={{ borderTop: '1px solid #1e293b', background: '#fafbff', overflow: 'hidden' }}
                                                >
                                                    <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1fr', gap: 48 }}>
                                                        <div style={{ borderRight: '1px solid #334155', paddingRight: 40 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>
                                                                <ListChecks size={16} /> Predições do Motor AI
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                                {group.suggestions.map((s: any) => (
                                                                    <motion.button
                                                                        key={s.jobCatalogId}
                                                                        whileHover={{ x: 6 }}
                                                                        onClick={() => handleApprove(group, s.jobCatalogId)}
                                                                        style={{ 
                                                                            textAlign: 'left', padding: '16px 20px', borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer',
                                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{s.jobTitle}</div>
                                                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Nível {LEVEL_LABELS[s.level]} · Grade {s.grade}</div>
                                                                        </div>
                                                                        <div style={{ fontSize: 13, fontWeight: 900, color: CONFIDENCE_COLOR(s.confidence) }}>{s.confidence}% Match</div>
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                                                <Search size={16} /> Exploração Manual
                                                            </div>
                                                            <div style={{ position: 'relative', marginBottom: 16 }}>
                                                                <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                                <input
                                                                    placeholder="Dígite o cargo para buscar no catálogo global..."
                                                                    value={search[group.internalTitle] || ''}
                                                                    onChange={e => setSearch(prev => ({ ...prev, [group.internalTitle]: e.target.value }))}
                                                                    style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none' }}
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                {filteredCatalog(group.internalTitle).map((job: any) => (
                                                                    <div key={job.id} onClick={() => handleApprove(group, job.id)} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #334155', background: 'white', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{job.title_std}</span>
                                                                        <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 800 }}>{LEVEL_LABELS[job.level]}</span>
                                                                    </div>
                                                                ))}
                                                                {filteredCatalog(group.internalTitle).length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 20 }}>Nenhum cargo encontrado no catálogo.</p>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {groups.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '100px 40px', background: 'white', borderRadius: 32, border: '2px dashed #cbd5e1' }}>
                            <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
                            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b' }}>Fluxo de Mapeamento Concluído</h3>
                            <p style={{ color: '#64748b', fontSize: 16, marginTop: 12, maxWidth: 500, margin: '12px auto 32px' }}>A Carolina AI processou todas as equivalências com sucesso. Sua estrutura está pronta para análise.</p>
                            <Link href="/" className="btn btn-primary" style={{ padding: '14px 32px', borderRadius: 14, fontWeight: 800 }}>Visualizar Inteligência do Snapshot</Link>
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );
}

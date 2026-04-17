'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Clock, Search, Loader2, RefreshCw,
    ChevronDown, ChevronUp, Sparkles, UserCheck, Target,
    BrainCircuit, Edit3, X, Check, ArrowRight, Filter,
    AlertTriangle, FileText, Zap
} from 'lucide-react';
import Link from 'next/link';

const LEVEL_LABELS: Record<string, string> = {
    ANY: 'Indiferente', JUNIOR: 'Júnior', PLENO: 'Pleno',
    SENIOR: 'Sênior', INTERN: 'Estagiário',
    COORD: 'Coordenador', MANAGER: 'Gerente', DIRECTOR: 'Diretor',
};

interface Suggestion {
    jobCatalogId: string;
    jobTitle: string;
    level: string;
    family: string;
    description: string | null;
    confidence: number;
}

interface Employee {
    employeeId: string;
    employeeKey: string;
    displayName: string;
    internalTitle: string;
    department: string | null;
    seniority: string | null;
    salary: number;
    hours: number | null;
    validated: boolean;
    existingMatch: {
        id: string;
        jobCatalogId: string;
        jobTitle: string;
        level: string;
        family: string;
        description: string | null;
        method: string;
    } | null;
    suggestions: Suggestion[];
}

// Built-in descriptions by common job families/titles
function builtInDescription(jobTitle: string, family: string): string {
    const t = jobTitle.toLowerCase();
    if (t.includes('engenheiro') || t.includes('desenvolvedor') || t.includes('software engineer')) {
        if (t.includes('sênior') || t.includes('senior')) return 'Responsável por arquitetar, desenvolver e revisar soluções de software complexas. Atua como referência técnica do time, conduzindo decisões de design e mentorando desenvolvedores junior e pleno.';
        if (t.includes('pleno')) return 'Desenvolve funcionalidades de média-alta complexidade com autonomia. Participa de code reviews e contribui para decisões técnicas do squad.';
        return 'Desenvolve funcionalidades sob supervisão, evolui suas habilidades técnicas e contribui para a qualidade do código com revisões guiadas.';
    }
    if (t.includes('analista') && t.includes('dados') || t.includes('data analyst')) return 'Coleta, processa e analisa dados para gerar insights estratégicos. Cria dashboards e relatórios que apoiam a tomada de decisão da liderança.';
    if (t.includes('product manager') || t.includes('gerente de produto')) return 'Define a visão e o roadmap do produto, priorizando iniciativas com base em dados de mercado e feedback dos usuários. Coordena squads multidisciplinares para entrega de valor.';
    if (t.includes('ux') || t.includes('designer')) return 'Projeta experiências digitais centradas no usuário, conduzindo pesquisas, criando wireframes, protótipos e validando soluções com testes de usabilidade.';
    if (t.includes('analista') && (t.includes('rh') || t.includes('recursos humanos') || t.includes('people'))) return 'Apoia processos de atração, seleção e desenvolvimento de talentos. Monitora indicadores de RH e implementa iniciativas de engajamento e cultura organizacional.';
    if (t.includes('analista financeiro') || t.includes('financial analyst')) return 'Realiza análises financeiras, controle orçamentário e elaboração de relatórios gerenciais, apoiando a gestão estratégica de custos e investimentos.';
    if (t.includes('scrum master') || t.includes('agile coach')) return 'Facilita as cerimônias ágeis do time, remove impedimentos e apoia a adoção de princípios e práticas Agile para maximizar a entrega de valor.';
    if (t.includes('devops') || t.includes('sre')) return 'Gerencia infraestrutura, automação de deploys e confiabilidade dos sistemas. Define e acompanha SLAs, SLOs e SLIs da plataforma.';
    if (t.includes('gerente') || t.includes('manager')) return 'Lidera equipe multidisciplinar, define objetivos, acompanha indicadores de performance e viabiliza o crescimento dos colaboradores sob sua gestão.';
    if (t.includes('diretor') || t.includes('director')) return 'Responsável pela definição estratégica e execução de resultados da área. Representa a função perante a liderança executiva e clientes estratégicos.';
    if (t.includes('coordenador') || t.includes('coord')) return 'Coordena as atividades operacionais da equipe, garantindo qualidade de entrega, cumprimento de prazos e alinhamento às diretrizes organizacionais.';
    if (family === 'Sales') return 'Prospecta, desenvolve e fecha oportunidades de negócio, construindo relacionamentos de longo prazo com clientes e atingindo metas de receita.';
    if (family === 'Marketing') return 'Planeja e executa estratégias de comunicação e branding para geração de demanda, posicionamento de marca e retenção de clientes.';
    return `Profissional da área de ${family || 'Tecnologia'}, responsável por entregar resultados alinhados às metas estratégicas da organização dentro do escopo de sua função.`;
}

export default function JobMatchPage() {
    const [loading, setLoading] = useState(true);
    const [snapshotId, setSnapshotId] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'validated'>('all');
    const [saving, setSaving] = useState<string | null>(null);

    // Per-employee edit state
    const [editSearch, setEditSearch] = useState<Record<string, string>>({});
    const [editDesc, setEditDesc] = useState<Record<string, string>>({});
    const [selectedCatalog, setSelectedCatalog] = useState<Record<string, string>>({}); // employeeId → jobCatalogId
    const [autoApproving, setAutoApproving] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const snapsRes = await fetch('/api/snapshots');
            const snapshots = await snapsRes.json();
            if (!snapshots?.length) {
                setError('Nenhuma folha encontrada. Faça o upload primeiro.');
                setLoading(false);
                return;
            }
            const sid = snapshots[0].id;
            setSnapshotId(sid);

            const [suggestRes, catalogRes] = await Promise.all([
                fetch(`/api/job-match/suggest/${sid}`),
                fetch('/api/job-match/catalog'),
            ]);

            if (suggestRes.ok) {
                const emps: Employee[] = await suggestRes.json();
                setEmployees(emps);
                // Inicializa selectedCatalog com os matches existentes
                const sel: Record<string, string> = {};
                const desc: Record<string, string> = {};
                emps.forEach(e => {
                    if (e.existingMatch) {
                        sel[e.employeeId] = e.existingMatch.jobCatalogId;
                        desc[e.employeeId] = e.existingMatch.description ||
                            builtInDescription(e.existingMatch.jobTitle, e.existingMatch.family);
                    } else if (e.suggestions.length > 0) {
                        sel[e.employeeId] = e.suggestions[0].jobCatalogId;
                        desc[e.employeeId] = e.suggestions[0].description ||
                            builtInDescription(e.suggestions[0].jobTitle, e.suggestions[0].family);
                    }
                });
                setSelectedCatalog(sel);
                setEditDesc(desc);
            }
            if (catalogRes.ok) setCatalog(await catalogRes.json());
        } catch {
            setError('Erro ao carregar mapeamento.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleValidate = async (emp: Employee) => {
        const jobCatalogId = selectedCatalog[emp.employeeId];
        if (!jobCatalogId) return;
        setSaving(emp.employeeId);
        try {
            await fetch('/api/job-match/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: emp.employeeId,
                    snapshotId,
                    jobCatalogId,
                    description: editDesc[emp.employeeId] || null,
                })
            });
            setEmployees(prev => prev.map(e =>
                e.employeeId === emp.employeeId
                    ? {
                        ...e, validated: true,
                        existingMatch: {
                            ...(e.existingMatch || {} as any),
                            jobCatalogId,
                            jobTitle: catalog.find(c => c.id === jobCatalogId)?.title_std || e.existingMatch?.jobTitle || '',
                            level: catalog.find(c => c.id === jobCatalogId)?.level || '',
                            family: catalog.find(c => c.id === jobCatalogId)?.family || '',
                            description: editDesc[emp.employeeId] || null,
                            method: 'MANUAL',
                        }
                    }
                    : e
            ));
            setExpanded(null);
        } finally {
            setSaving(null);
        }
    };

    const handleUnvalidate = async (emp: Employee) => {
        setSaving(emp.employeeId);
        try {
            await fetch('/api/job-match/validate', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employeeId: emp.employeeId })
            });
            setEmployees(prev => prev.map(e =>
                e.employeeId === emp.employeeId
                    ? { ...e, validated: false, existingMatch: null }
                    : e
            ));
        } finally {
            setSaving(null);
        }
    };

    const handleAutoApprove = async () => {
        setAutoApproving(true);
        try {
            await fetch(`/api/job-match/auto-approve/${snapshotId}`, { method: 'POST' });
            await fetchData();
        } finally {
            setAutoApproving(false);
        }
    };

    const handleSelectCatalog = (empId: string, catalogId: string) => {
        setSelectedCatalog(prev => ({ ...prev, [empId]: catalogId }));
        const item = catalog.find(c => c.id === catalogId);
        if (item && !editDesc[empId]) {
            setEditDesc(prev => ({ ...prev, [empId]: builtInDescription(item.title_std, item.family) }));
        }
    };

    // Filtered catalog search per employee
    const filteredCatalog = (empId: string) => {
        const q = (editSearch[empId] || '').toLowerCase();
        if (!q) return catalog.slice(0, 8);
        return catalog.filter(c =>
            c.title_std.toLowerCase().includes(q) ||
            (c.family || '').toLowerCase().includes(q) ||
            (LEVEL_LABELS[c.level] || '').toLowerCase().includes(q)
        ).slice(0, 8);
    };

    // Stats
    const validated = employees.filter(e => e.validated).length;
    const pending = employees.filter(e => !e.validated).length;
    const progress = employees.length > 0 ? Math.round((validated / employees.length) * 100) : 0;

    // Filtered employees list
    const visibleEmployees = employees.filter(e => {
        const matchesSearch = !globalSearch ||
            e.displayName.toLowerCase().includes(globalSearch.toLowerCase()) ||
            e.internalTitle.toLowerCase().includes(globalSearch.toLowerCase()) ||
            (e.department || '').toLowerCase().includes(globalSearch.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'validated' && e.validated) ||
            (filterStatus === 'pending' && !e.validated);
        return matchesSearch && matchesFilter;
    });

    const allValidated = employees.length > 0 && pending === 0;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 1200, paddingBottom: 120 }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ padding: '4px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BrainCircuit size={13} /> Curadoria de Cargos
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 8 }}>
                            Revisão & Validação<br />
                            <span style={{ color: '#94a3b8' }}>de Cargos.</span>
                        </h1>
                        <p style={{ color: '#64748b', fontSize: 15 }}>
                            Revise o cargo equivalente de cada colaborador, edite a descrição e valide um a um para avançar ao Diagnóstico PRO.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button onClick={fetchData} style={{ padding: '10px 18px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                            <RefreshCw size={15} /> Atualizar
                        </button>
                        {pending > 0 && (
                            <button onClick={handleAutoApprove} disabled={autoApproving} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                {autoApproving ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                Validar Pendentes Automaticamente ({pending})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="card" style={{ padding: 28, marginBottom: 32, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 32, alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Total de Colaboradores</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#1e293b' }}>{employees.length}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Validados</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#10b981' }}>{validated}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Pendentes</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: pending > 0 ? '#f59e0b' : '#10b981' }}>{pending}</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 120 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Progresso</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5' }}>{progress}%</div>
                    </div>
                </div>
                <div style={{ marginTop: 20, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ height: '100%', background: progress === 100 ? '#10b981' : 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 4 }}
                    />
                </div>
                {allValidated && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                        <Link href="/diagnostics" className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                            <Sparkles size={18} /> Avançar para Diagnóstico PRO <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        placeholder="Buscar por nome, cargo ou departamento..."
                        value={globalSearch}
                        onChange={e => setGlobalSearch(e.target.value)}
                        style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none', background: 'white' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(['all', 'pending', 'validated'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilterStatus(f)}
                            style={{
                                padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                                border: filterStatus === f ? 'none' : '1px solid #e2e8f0',
                                background: filterStatus === f ? '#1e293b' : 'white',
                                color: filterStatus === f ? 'white' : '#64748b',
                                transition: 'all 0.15s'
                            }}
                        >
                            {f === 'all' ? `Todos (${employees.length})` : f === 'pending' ? `Pendentes (${pending})` : `Validados (${validated})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Employee Cards */}
            {loading ? (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
                    <Loader2 size={44} className="animate-spin" color="#4f46e5" />
                    <p style={{ fontWeight: 600, color: '#64748b' }}>Carregando colaboradores...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
                    <AlertTriangle size={56} color="#f59e0b" style={{ margin: '0 auto 20px' }} />
                    <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Ação Necessária</h2>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>{error}</p>
                    <Link href="/snapshots" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12 }}>Realizar Upload</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <AnimatePresence>
                        {visibleEmployees.map(emp => {
                            const isExpanded = expanded === emp.employeeId;
                            const isSaving = saving === emp.employeeId;
                            const currentCatalogId = selectedCatalog[emp.employeeId];
                            const currentCatalogItem = catalog.find(c => c.id === currentCatalogId);
                            const topSuggestion = emp.suggestions[0];

                            return (
                                <motion.div
                                    key={emp.employeeId}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'white',
                                        borderRadius: 18,
                                        border: '1px solid',
                                        borderColor: emp.validated ? '#10b98125' : isExpanded ? '#4f46e530' : '#e2e8f0',
                                        overflow: 'hidden',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                        boxShadow: isExpanded ? '0 8px 32px rgba(79,70,229,0.07)' : '0 1px 4px rgba(0,0,0,0.02)',
                                    }}
                                >
                                    {/* Row header */}
                                    <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                        {/* Status icon */}
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                            background: emp.validated ? '#10b98112' : '#f1f5f9',
                                            color: emp.validated ? '#10b981' : '#94a3b8',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {emp.validated ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <Clock size={20} />}
                                        </div>

                                        {/* Employee info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                                                <span style={{ fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{emp.displayName}</span>
                                                {emp.department && (
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>{emp.department}</span>
                                                )}
                                                {emp.validated && emp.existingMatch?.method === 'MANUAL' && (
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 20 }}>
                                                        Revisado
                                                    </span>
                                                )}
                                                {emp.validated && emp.existingMatch?.method === 'AI_AUTO' && (
                                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: 20 }}>
                                                        Auto-validado
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                                                <span style={{ fontStyle: 'italic' }}>{emp.internalTitle}</span>
                                                {emp.seniority && <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>}
                                                {emp.seniority && <span>{emp.seniority}</span>}
                                                {emp.hours && <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 11 }}>({emp.hours}h)</span>}
                                            </div>
                                        </div>

                                        {/* Equivalent job */}
                                        <div style={{ textAlign: 'right', minWidth: 200, paddingRight: 12 }}>
                                            {emp.validated && emp.existingMatch ? (
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{emp.existingMatch.jobTitle}</div>
                                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{LEVEL_LABELS[emp.existingMatch.level] || emp.existingMatch.level} · {emp.existingMatch.family}</div>
                                                </div>
                                            ) : topSuggestion ? (
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>IA sugere:</div>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#475569' }}>{topSuggestion.jobTitle}</div>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Sem sugestão automática</span>
                                            )}
                                        </div>

                                        {/* Salary */}
                                        <div style={{ textAlign: 'right', minWidth: 120 }}>
                                            <div style={{ fontSize: 14, fontWeight: 900, color: '#1e293b' }}>
                                                R$ {emp.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>salário base</div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {emp.validated ? (
                                                <button
                                                    onClick={() => handleUnvalidate(emp)}
                                                    disabled={!!isSaving}
                                                    style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid #fee2e2', background: 'white', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    Reabrir
                                                </button>
                                            ) : null}
                                            <button
                                                onClick={() => setExpanded(isExpanded ? null : emp.employeeId)}
                                                style={{ padding: '8px 14px', borderRadius: 10, background: isExpanded ? '#1e293b' : 'white', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isExpanded ? 'white' : '#475569' }}
                                            >
                                                <Edit3 size={14} />
                                                {isExpanded ? 'Fechar' : 'Editar'}
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded editor */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                style={{ borderTop: '1px solid #f1f5f9', overflow: 'hidden' }}
                                            >
                                                <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                                                    {/* Left: cargo selection */}
                                                    <div>
                                                        <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                                                            Cargo Equivalente no Mercado
                                                        </div>

                                                        {/* Suggestions */}
                                                        {emp.suggestions.length > 0 && (
                                                            <div style={{ marginBottom: 16 }}>
                                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    <Sparkles size={12} /> Sugestões da IA
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                    {emp.suggestions.slice(0, 4).map(s => (
                                                                        <button
                                                                            key={s.jobCatalogId}
                                                                            onClick={() => handleSelectCatalog(emp.employeeId, s.jobCatalogId)}
                                                                            style={{
                                                                                textAlign: 'left', padding: '10px 14px', borderRadius: 12,
                                                                                border: `1px solid ${currentCatalogId === s.jobCatalogId ? '#4f46e5' : '#e2e8f0'}`,
                                                                                background: currentCatalogId === s.jobCatalogId ? '#eef2ff' : 'white',
                                                                                cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                                transition: 'all 0.15s'
                                                                            }}
                                                                        >
                                                                            <div>
                                                                                <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{s.jobTitle}</div>
                                                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{LEVEL_LABELS[s.level] || s.level} · {s.family}</div>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <span style={{ fontSize: 11, fontWeight: 800, color: s.confidence >= 60 ? '#10b981' : '#f59e0b' }}>
                                                                                    {s.confidence}%
                                                                                </span>
                                                                                {currentCatalogId === s.jobCatalogId && <Check size={16} color="#4f46e5" />}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Manual search */}
                                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Search size={12} /> Busca manual no catálogo
                                                        </div>
                                                        <div style={{ position: 'relative', marginBottom: 8 }}>
                                                            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                                            <input
                                                                placeholder="Buscar cargo no catálogo..."
                                                                value={editSearch[emp.employeeId] || ''}
                                                                onChange={e => setEditSearch(prev => ({ ...prev, [emp.employeeId]: e.target.value }))}
                                                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, outline: 'none' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                                                            {filteredCatalog(emp.employeeId).map(item => (
                                                                <div
                                                                    key={item.id}
                                                                    onClick={() => handleSelectCatalog(emp.employeeId, item.id)}
                                                                    style={{
                                                                        padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                                                                        border: `1px solid ${currentCatalogId === item.id ? '#4f46e5' : '#f1f5f9'}`,
                                                                        background: currentCatalogId === item.id ? '#eef2ff' : '#f8fafc',
                                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                        fontSize: 12, transition: 'all 0.1s'
                                                                    }}
                                                                >
                                                                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.title_std}</span>
                                                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{LEVEL_LABELS[item.level] || item.level}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Right: description + validate */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                        <div>
                                                            <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                                                Descrição Sumária do Cargo
                                                            </div>
                                                            <textarea
                                                                value={editDesc[emp.employeeId] || ''}
                                                                onChange={e => setEditDesc(prev => ({ ...prev, [emp.employeeId]: e.target.value }))}
                                                                rows={6}
                                                                placeholder="Informe a descrição sumária do cargo para este colaborador..."
                                                                style={{
                                                                    width: '100%', padding: '14px', borderRadius: 12,
                                                                    border: '1px solid #e2e8f0', fontSize: 13, lineHeight: 1.6,
                                                                    resize: 'vertical', outline: 'none', fontFamily: 'inherit',
                                                                    color: '#1e293b', fontWeight: 500, boxSizing: 'border-box',
                                                                }}
                                                            />
                                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                                                                Será usada nos entregáveis do Diagnóstico PRO. Editável a qualquer momento.
                                                            </div>
                                                        </div>

                                                        {/* Selected cargo preview */}
                                                        {currentCatalogItem && (
                                                            <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                                                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Cargo selecionado</div>
                                                                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{currentCatalogItem.title_std}</div>
                                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                                                    {LEVEL_LABELS[currentCatalogItem.level] || currentCatalogItem.level} · {currentCatalogItem.family}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => handleValidate(emp)}
                                                            disabled={!currentCatalogId || !!isSaving}
                                                            className="btn btn-primary"
                                                            style={{
                                                                padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: 15,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                                opacity: !currentCatalogId ? 0.5 : 1,
                                                                cursor: !currentCatalogId ? 'not-allowed' : 'pointer',
                                                                marginTop: 'auto',
                                                            }}
                                                        >
                                                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                            Validar este Colaborador
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {visibleEmployees.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '60px 40px', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                            <UserCheck size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>Nenhum resultado</h3>
                            <p style={{ color: '#64748b', marginTop: 8 }}>Tente ajustar os filtros de busca.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Sticky bottom CTA */}
            {allValidated && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                        borderRadius: 20, padding: '20px 36px', boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', gap: 20, zIndex: 50,
                    }}
                >
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>✓ Todos validados</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>Pronto para o Diagnóstico PRO</div>
                    </div>
                    <Link href="/diagnostics" className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
                        Ir para Diagnóstico <ArrowRight size={18} />
                    </Link>
                </motion.div>
            )}
        </motion.div>
    );
}

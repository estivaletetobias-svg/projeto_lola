import { safeFetch } from "@/app/api-config";
'use client';

import { useState } from 'react';
import {
    Rocket,
    Map,
    Target,
    BarChart,
    CheckCircle2,
    Clock,
    Layers,
    Lock,
    ChevronRight,
    Zap,
    Globe,
    PieChart as PieIcon,
    Cpu,
    Link as LinkIcon,
    Star,
    Users
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SubPhase {
    title: string;
    status: 'DONE' | 'DOING' | 'TODO';
    details: string;
}

interface Phase {
    id: string;
    category: 'MVP' | 'POST-MVP';
    title: string;
    progress: number;
    objective: string;
    icon: React.ReactNode;
    color: string;
    subPhases: SubPhase[];
}

export default function RoadmapPage() {
    const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);

    const adminUsers = ['Tobias Estivalete', 'Carolina Farah'];

    const phases: Phase[] = [
        // --- MVP SECTION ---
        {
            id: 'p1',
            category: 'MVP',
            title: 'Base & Arquitetura Multi-tenant',
            progress: 100,
            objective: 'Fundação escalável com isolamento total de dados entre clientes.',
            icon: <Layers size={24} />,
            color: '#6366f1',
            subPhases: [
                { title: 'Setup NestJS + NextJS', status: 'DONE', details: 'Configuração estrutural concluída.' },
                { title: 'Modelagem Prisma (Multi-tenancy)', status: 'DONE', details: 'Tenant Isolation ativo em todas as tabelas.' },
                { title: 'Sistema de Auth Guard', status: 'DONE', details: 'Acesso seguro por tenant implementado.' },
            ]
        },
        {
            id: 'p2',
            category: 'MVP',
            title: 'Motores de Inteligência MVP',
            progress: 95,
            objective: 'Processamento de folha e mapeamento automático de cargos.',
            icon: <Zap size={24} />,
            color: '#a855f7',
            subPhases: [
                { title: 'Upload & S3 Integration', status: 'DONE', details: 'Upload via AWS S3 Presigned URLs funcional.' },
                { title: 'Algoritmo de Job Match', status: 'DONE', details: 'Motor de comparação de cargos (REGEX v1) ativo.' },
                { title: 'Worker de Processamento (BullMQ)', status: 'DONE', details: 'Fila de processamento assíncrona configurada.' },
            ]
        },
        {
            id: 'p3',
            category: 'MVP',
            title: 'Experiência Executiva & Pitch',
            progress: 92,
            objective: 'Interface premium e simulador de mérito para CFOs.',
            icon: <Target size={24} />,
            color: '#ec4899',
            subPhases: [
                { title: 'Dashboard de Diagnóstico', status: 'DONE', details: 'Gaps de mercado (P25/P50/P75) visualmente ativos.' },
                { title: 'Simulador de Mérito', status: 'DONE', details: '3 cenários de ajuste (Conservador/Equilibrado/Agressivo).' },
                { title: 'Interface Copilot IA', status: 'DOING', details: 'Chat UI pronto para integração com LLM.' },
            ]
        },
        {
            id: 'p4',
            category: 'MVP',
            title: 'Infraestrutura Cloud (AWS)',
            progress: 35,
            objective: 'SaaS operante e autogerenciável na nuvem AWS.',
            icon: <Globe size={24} />,
            color: '#06b6d4',
            subPhases: [
                { title: 'Deploy Frontend Vercel', status: 'DONE', details: 'Pipeline CI/CD ativo para demos rápidas.' },
                { title: 'Backend AWS ECS/Fargate', status: 'TODO', details: 'Containers NestJS na AWS Fargate (Próximo).' },
                { title: 'RDS PostgreSQL Setup', status: 'TODO', details: 'Banco produtivo autogerenciado.' },
            ]
        },
        // --- POST-MVP SECTION ---
        {
            id: 'p5',
            category: 'POST-MVP',
            title: 'Inteligência Preditiva (AI)',
            progress: 0,
            objective: 'Modelos de GenAI para previsão de churn e retenção.',
            icon: <Cpu size={24} />,
            color: '#f59e0b',
            subPhases: [
                { title: 'IA Generativa no Copilot', status: 'TODO', details: 'Respostas profundas sobre tendências de mercado via LLM.' },
                { title: 'Previsão de Risco de Saída', status: 'TODO', details: 'Detecção de colaboradores com alto risco de turnover por salário.' },
            ]
        },
        {
            id: 'p6',
            category: 'POST-MVP',
            title: 'Ecossistema de Integrações',
            progress: 0,
            objective: 'Conectividade nativa com ERPs e HCMs do mercado.',
            icon: <LinkIcon size={24} />,
            color: '#10b981',
            subPhases: [
                { title: 'Integração SAP / Senior / Workday', status: 'TODO', details: 'Webhook e conectores para leitura automática de folha.' },
                { title: 'API Pública', status: 'TODO', details: 'Interface para desenvolvedores externos consumirem dados de remuneração.' },
            ]
        },
        {
            id: 'p7',
            category: 'POST-MVP',
            title: 'Portal do Colaborador (Total Rewards)',
            progress: 0,
            objective: 'Interface para transparência salarial e benefícios.',
            icon: <Users size={24} />,
            color: '#3b82f6',
            subPhases: [
                { title: 'Extrato de Remuneração Total', status: 'TODO', details: 'Visão clara para o colaborador sobre seu pacote completo.' },
                { title: 'Market Positioning Visibility', status: 'TODO', details: 'Autonomia para o colaborador entender sua posição na faixa.' },
            ]
        }
    ];

    const mvpProgress = Math.round(phases.filter(p => p.category === 'MVP').reduce((acc, p) => acc + p.progress, 0) / 4);
    const totalProgress = Math.round(phases.reduce((acc, p) => acc + p.progress, 0) / phases.length);

    const pieData = [
        { name: 'MVP Concluído', value: mvpProgress, color: '#6366f1' },
        { name: 'Full Project Scope', value: 100 - mvpProgress, color: '#1e293b' },
    ];

    return (
        <div style={{ color: '#ffffff', maxWidth: 1200, margin: '0 auto', background: '#020617', padding: '20px', minHeight: '100vh' }}>
            {/* Header Admin */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 40,
                padding: '32px',
                background: '#0f172a',
                borderRadius: '24px',
                border: '1px solid #1e293b'
            }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', marginBottom: 8 }}>
                        Evolução Estratégica SinSalarial
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 14 }}>
                        <Lock size={16} />
                        <span>ADMIN: <strong style={{ color: '#ffffff' }}>Tobias Estivalete & Carolina Farah</strong></span>
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: 32 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', marginBottom: 4 }}>MVP STATUS</div>
                        <div style={{ fontSize: 40, fontWeight: 900, color: '#ffffff' }}>{mvpProgress}%</div>
                    </div>
                    <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: 32 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>DÉBITO TÉCNICO TOTAL</div>
                        <div style={{ fontSize: 40, fontWeight: 900, color: '#4b5563' }}>{totalProgress}%</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 48 }}>
                {/* Gráfico Macro */}
                <div className="card" style={{ background: '#0f172a', padding: '32px', display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div style={{ width: 180, height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Visão de Longo Prazo</h3>
                        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 220, lineHeight: 1.5 }}>
                            Estamos finalizando o <strong style={{ color: '#6366f1' }}>MVP (Foco Atual)</strong>. O escopo completo do sistema estende-se por mais 3 fases de escala e automação.
                        </p>
                    </div>
                </div>

                <div className="card" style={{ background: '#0f172a', padding: '32px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#6366f1', marginBottom: 24, letterSpacing: '0.1em' }}>MÉTRICAS DE PERFORMANCE</h3>
                    <div style={{ display: 'grid', gap: 20 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                <span>Health Score do Projeto</span>
                                <span style={{ color: '#10b981', fontWeight: 700 }}>EXCELENTE (A+)</span>
                            </div>
                            <div style={{ width: '100%', height: 4, background: 'white', borderRadius: 2 }}><div style={{ width: '95%', height: '100%', background: '#10b981', borderRadius: 2 }}></div></div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
                            <Star size={16} color="#f59e0b" />
                            <span>Próximo Grande Marco: Lançamento Alpha (Fase Cloud)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION: MVP */}
            <h2 style={{ fontSize: 14, fontWeight: 900, color: '#6366f1', marginBottom: 20, letterSpacing: '0.2em' }}>PHASE 1: MVP (ALVO ATUAL)</h2>
            <div style={{ display: 'grid', gap: 12, marginBottom: 48 }}>
                {phases.filter(p => p.category === 'MVP').map((phase) => (
                    <PhaseCard key={phase.id} phase={phase} onSelect={() => setSelectedPhase(phase)} />
                ))}
            </div>

            {/* SECTION: POST-MVP */}
            <h2 style={{ fontSize: 14, fontWeight: 900, color: '#4b5563', marginBottom: 20, letterSpacing: '0.2em' }}>PHASE 2: ESCALA & ECOSSISTEMA (FUTURO)</h2>
            <div style={{ display: 'grid', gap: 12 }}>
                {phases.filter(p => p.category === 'POST-MVP').map((phase) => (
                    <PhaseCard key={phase.id} phase={phase} onSelect={() => setSelectedPhase(phase)} />
                ))}
            </div>

            {/* Modal Detalhes */}
            {selectedPhase && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }} onClick={() => setSelectedPhase(null)}>
                    <div style={{
                        width: '95%',
                        maxWidth: 550,
                        background: '#0f172a',
                        borderRadius: '28px',
                        padding: '40px',
                        border: '1px solid #1e293b'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                            <div style={{ padding: 14, borderRadius: 16, background: `${selectedPhase.color}20`, color: selectedPhase.color, border: `1px solid ${selectedPhase.color}40` }}>
                                {selectedPhase.icon}
                            </div>
                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{selectedPhase.title}</h2>
                        </div>

                        <div style={{ display: 'grid', gap: 16, marginBottom: 40 }}>
                            {selectedPhase.subPhases.map((sub, i) => (
                                <div key={i} style={{ padding: 20, background: 'white', borderRadius: '20px', border: '1px solid #334155' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>{sub.title}</span>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 900,
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            background: sub.status === 'DONE' ? '#10b981' : (sub.status === 'DOING' ? '#f59e0b' : '#4b5563'),
                                            color: '#000'
                                        }}>
                                            {sub.status}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{sub.details}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setSelectedPhase(null)}
                            style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#fff', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer' }}
                        >
                            FECHAR
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        .card:hover { border-color: #6366f1 !important; transform: scale(1.005); }
      `}</style>
        </div>
    );
}

function PhaseCard({ phase, onSelect }: { phase: Phase, onSelect: () => void }) {
    return (
        <div
            className="card"
            onClick={onSelect}
            style={{
                cursor: 'pointer',
                padding: '20px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                transition: 'all 0.2s',
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '16px',
                opacity: phase.category === 'POST-MVP' && phase.progress === 0 ? 0.6 : 1
            }}
        >
            <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: `${phase.color}20`,
                color: phase.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${phase.color}40`
            }}>
                {phase.icon}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff' }}>{phase.title}</h3>
                    <span style={{ fontSize: 14, fontWeight: 900, color: phase.color }}>{phase.progress}%</span>
                </div>
                <div style={{ width: '100%', height: 4, background: 'white', borderRadius: 2 }}>
                    <div style={{ width: `${phase.progress}%`, height: '100%', background: phase.color, borderRadius: 2 }}></div>
                </div>
            </div>

            <div style={{ color: '#444' }}><ChevronRight size={20} /></div>
        </div>
    );
}

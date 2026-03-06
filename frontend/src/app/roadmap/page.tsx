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
    Info,
    ChevronRight,
    Zap,
    ShieldCheck,
    Globe
} from 'lucide-react';

interface SubPhase {
    title: string;
    status: 'DONE' | 'DOING' | 'TODO';
    details: string;
}

interface Phase {
    id: string;
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
        {
            id: 'p1',
            title: 'Base & Arquitetura Multi-tenant',
            progress: 100,
            objective: 'Estabelecer a fundação escalável do SaaS SinSalarial.',
            icon: <Layers size={24} />,
            color: '#4f46e5',
            subPhases: [
                { title: 'Setup NestJS + NextJS', status: 'DONE', details: 'Configuração dos ambientes de desenvolvimento e estrutura de pastas.' },
                { title: 'Modelagem Prisma (Multi-tenancy)', status: 'DONE', details: 'Implementação do tenant_id em todas as entidades críticas.' },
                { title: 'Sistema de Auth Guard', status: 'DONE', details: 'Proteção de rotas e injeção automática de contexto de tenant.' },
            ]
        },
        {
            id: 'p2',
            title: 'Motores de Inteligência MVP',
            progress: 95,
            objective: 'Processamento automático de folha e mapeamento de cargos.',
            icon: <Zap size={24} />,
            color: '#a855f7',
            subPhases: [
                { title: 'Upload & S3 Integration', status: 'DONE', details: 'Fluxo de upload seguro com presigned URLs.' },
                { title: 'Algoritmo de Job Match', status: 'DONE', details: 'Mapeamento inteligente de cargos internos vs mercado.' },
                { title: 'Worker de Processamento (BullMQ)', status: 'DONE', details: 'Processamento assíncrono de planilhas pesadas.' },
            ]
        },
        {
            id: 'p3',
            title: 'Experiência Executiva & Pitch',
            progress: 90,
            objective: 'Interface premium focada em CFOs e gestores de RH.',
            icon: <Target size={24} />,
            color: '#ec4899',
            subPhases: [
                { title: 'Dashboard de Diagnóstico', status: 'DONE', details: 'Visualização de gaps (P25/P50/P75) com Recharts.' },
                { title: 'Simulador de Mérito', status: 'DONE', details: '3 cenários de ajuste orçamentário automático.' },
                { title: 'Mock do Copilot SinSalarial', status: 'DOING', details: 'Chat de IA para insights estratégicos (preparando Tool Calling).' },
            ]
        },
        {
            id: 'p4',
            title: 'Infraestrutura Cloud (AWS)',
            progress: 35,
            objective: 'Colocar o sistema em produção operante na AWS.',
            icon: <Globe size={24} />,
            color: '#06b6d4',
            subPhases: [
                { title: 'Deploy Frontend Vercel', status: 'DONE', details: 'Hospedagem do front com CI/CD e SSL.' },
                { title: 'Backend AWS ECS/Fargate', status: 'TODO', details: 'Provisionamento do motor NestJS em containers.' },
                { title: 'RDS PostgreSQL Setup', status: 'TODO', details: 'Banco de dados produtivo com backups e alta disponibilidade.' },
            ]
        }
    ];

    return (
        <div style={{ color: '#f8fafc', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header Admin */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 48,
                padding: '24px',
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
                        Roadmap de Construção
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 13 }}>
                        <Lock size={14} />
                        <span>Acesso Exclusivo: <strong>{adminUsers.join(' & ')}</strong></span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>EVOLUÇÃO GLOBAL</div>
                    <div style={{ fontSize: 32, fontWeight: 800 }}>82%</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 32 }}>
                {/* Métricas e OKRs */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>MÉTRICAS DE DESENVOLVIMENTO</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                    <span>Cobertura de Código</span>
                                    <span style={{ fontWeight: 600 }}>85%</span>
                                </div>
                                <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3 }}><div style={{ width: '85%', height: '100%', background: '#4f46e5', borderRadius: 3 }}></div></div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                    <span>Performance (Lighthouse)</span>
                                    <span style={{ fontWeight: 600 }}>98</span>
                                </div>
                                <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3 }}><div style={{ width: '98%', height: '100%', background: '#10b981', borderRadius: 3 }}></div></div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: 20 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 16 }}>OBJETIVOS CRÍTICOS</h3>
                        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <CheckCircle2 size={16} color="#10b981" /> MVP vendável para Clientes B2B
                            </li>
                            <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <CheckCircle2 size={16} color="#10b981" /> Diferenciação técnica via Job Match
                            </li>
                            <li style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>
                                <Clock size={16} color="#f59e0b" /> Integração Real com AWS Cloud
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Linha do Tempo / Fases */}
                <main>
                    <div style={{ display: 'grid', gap: 24 }}>
                        {phases.map((phase) => (
                            <div
                                key={phase.id}
                                className="card"
                                onClick={() => setSelectedPhase(phase)}
                                style={{
                                    cursor: 'pointer',
                                    padding: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 24,
                                    transition: 'transform 0.2s, background 0.2s',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 12,
                                    background: `${phase.color}20`,
                                    color: phase.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {phase.icon}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{phase.title}</h3>
                                        <span style={{ fontSize: 14, fontWeight: 800, color: phase.color }}>{phase.progress}%</span>
                                    </div>
                                    <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>{phase.objective}</p>
                                    <div style={{ width: '100%', height: 4, background: '#1e293b', borderRadius: 2 }}>
                                        <div style={{ width: `${phase.progress}%`, height: '100%', background: phase.color, borderRadius: 2 }}></div>
                                    </div>
                                </div>

                                <div style={{ color: '#4b5563' }}><ChevronRight /></div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Modal de Detalhes da Fase */}
            {selectedPhase && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 100
                }} onClick={() => setSelectedPhase(null)}>
                    <div style={{
                        width: '90%',
                        maxWidth: 600,
                        background: '#0f172a',
                        borderRadius: 24,
                        padding: 32,
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                            <div style={{ padding: 12, borderRadius: 12, background: `${selectedPhase.color}20`, color: selectedPhase.color }}>
                                {selectedPhase.icon}
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 800 }}>{selectedPhase.title}</h2>
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <h4 style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>SUBFASES & STATUS</h4>
                            <div style={{ display: 'grid', gap: 16 }}>
                                {selectedPhase.subPhases.map((sub, i) => (
                                    <div key={i} style={{ padding: 16, background: '#1e293b', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 600, fontSize: 14 }}>{sub.title}</span>
                                            <span style={{
                                                fontSize: 10,
                                                fontWeight: 800,
                                                padding: '2px 8px',
                                                borderRadius: 10,
                                                background: sub.status === 'DONE' ? '#10b98120' : (sub.status === 'DOING' ? '#f59e0b20' : '#4b556320'),
                                                color: sub.status === 'DONE' ? '#10b981' : (sub.status === 'DOING' ? '#f59e0b' : '#94a3b8')
                                            }}>
                                                {sub.status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{sub.details}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPhase(null)}
                            style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'linear-gradient(to right, #6366f1, #a855f7)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                        >
                            Fechar Detalhes
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        .card:hover {
          background: rgba(15, 23, 42, 0.9) !important;
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.3) !important;
        }
      `}</style>
        </div>
    );
}

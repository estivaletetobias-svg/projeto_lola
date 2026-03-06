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
    PieChart as PieIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
        }
    ];

    const pieData = [
        { name: 'Concluído', value: 82, color: '#6366f1' },
        { name: 'Em Aberto', value: 18, color: '#1e293b' },
    ];

    return (
        <div style={{ color: '#ffffff', maxWidth: 1200, margin: '0 auto', background: '#020617', padding: '20px', minHeight: '100vh' }}>
            {/* Header Admin - High Contrast */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 40,
                padding: '32px',
                background: '#0f172a',
                borderRadius: '24px',
                border: '1px solid #1e293b',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                        Roadmap Estratégico SinSalarial
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 14 }}>
                        <Lock size={16} />
                        <span>ADMIN: <strong style={{ color: '#ffffff' }}>Tobias Estivalete & Carolina Farah</strong></span>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em', marginBottom: 4 }}>STATUS GLOBAL</div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>82%</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
                {/* Gráfico de Pizza Central */}
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
                        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Evolução do Todo</h3>
                        <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 200, lineHeight: 1.5 }}>
                            O MVP funcional está <strong style={{ color: '#fff' }}>82% concluído</strong>, pronto para o pitch de investimento e feedback da Lola.
                        </p>
                    </div>
                </div>

                {/* Métricas e OKRs */}
                <div className="card" style={{ background: '#0f172a', padding: '32px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: '#6366f1', marginBottom: 24, letterSpacing: '0.1em' }}>OBJETIVOS CRÍTICOS</h3>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 15 }}>
                            <CheckCircle2 size={20} color="#10b981" />
                            <span>MVP pronto para demonstração executiva</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 15 }}>
                            <CheckCircle2 size={20} color="#10b981" />
                            <span>Diferenciação via Job Match Algoritmico</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 15 }}>
                            <Clock size={20} color="#f59e0b" />
                            <span style={{ color: '#94a3b8' }}>Migração para Infra AWS Gerenciada</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Linha do Tempo / Fases */}
            <div style={{ display: 'grid', gap: 16 }}>
                {phases.map((phase) => (
                    <div
                        key={phase.id}
                        className="card"
                        onClick={() => setSelectedPhase(phase)}
                        style={{
                            cursor: 'pointer',
                            padding: '24px 32px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 32,
                            transition: 'all 0.2s',
                            background: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '20px'
                        }}
                    >
                        <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>{phase.title}</h3>
                                <span style={{ fontSize: 16, fontWeight: 900, color: phase.color }}>{phase.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 4 }}>
                                <div style={{ width: `${phase.progress}%`, height: '100%', background: phase.color, borderRadius: 4 }}></div>
                            </div>
                        </div>

                        <div style={{ color: '#444' }}><ChevronRight /></div>
                    </div>
                ))}
            </div>

            {/* Modal - Improved Readability */}
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
                        border: '1px solid #1e293b',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
                            <div style={{ padding: 14, borderRadius: 16, background: `${selectedPhase.color}20`, color: selectedPhase.color, border: `1px solid ${selectedPhase.color}40` }}>
                                {selectedPhase.icon}
                            </div>
                            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>{selectedPhase.title}</h2>
                        </div>

                        <div style={{ marginBottom: 40 }}>
                            <div style={{ display: 'grid', gap: 16 }}>
                                {selectedPhase.subPhases.map((sub, i) => (
                                    <div key={i} style={{ padding: 20, background: '#1e293b', borderRadius: '20px', border: '1px solid #334155' }}>
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
                                        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{sub.details}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPhase(null)}
                            style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#fff', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: 16 }}
                        >
                            FECHAR DETALHES
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
        .card:hover {
          border-color: #6366f1 !important;
          transform: scale(1.005);
        }
      `}</style>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart2, Users, TrendingUp, Zap, FileText,
  AlertTriangle, CheckCircle2, ArrowRight, Search,
  Layers, BookOpen, Loader2
} from 'lucide-react';
import Link from 'next/link';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

interface Stats {
  totalEmployees: number;
  avgGap: number;
  monthlyCostP50: number;
  lastSnapshotDate: string;
  mappedCount?: number;
  belowP25Count?: number;
  isDemo: boolean;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    avgGap: 0,
    monthlyCostP50: 0,
    lastSnapshotDate: '—',
    isDemo: true
  });
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copilotInput, setCopilotInput] = useState('');

  useEffect(() => {
    const host = window.location.hostname;
    Promise.all([
      fetch(`http://${host}:3000/diagnostics/dashboard-stats`).then(r => r.json()).catch(() => null),
      fetch(`http://${host}:3000/payroll/snapshots?tenantId=default`).then(r => r.json()).catch(() => []),
    ]).then(async ([dashStats, snaps]) => {
      if (dashStats && !dashStats.error) {
        setStats({
          ...dashStats,
          lastSnapshotDate: dashStats.lastSnapshotDate
            ? new Date(dashStats.lastSnapshotDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : '—'
        });
      }
      // Enriquece com análise do snapshot mais recente
      if (snaps?.length > 0) {
        try {
          const res = await fetch(`http://${host}:3000/salary-engine/analyze/${snaps[0].id}`);
          const result = await res.json();
          if (result.status === 'success') setAnalysis(result);
        } catch (_) { }
      }
      setLoading(false);
    });
  }, []);

  const gapColor = stats.avgGap < -15 ? '#ef4444' : stats.avgGap < -5 ? '#f59e0b' : '#10b981';
  const gapLabel = stats.avgGap < -15 ? 'Ação Urgente' : stats.avgGap < -5 ? 'Monitorando' : 'Saudável';

  // Dados para o mini gráfico de distribuição de gaps
  const distributionData = analysis?.mappedEmployees?.map((emp: any) => {
    const struct = analysis.suggestedSalaryStructure?.find((s: any) => s.grade === `G${emp.grade}`);
    const p50 = struct?.midpoint || 1;
    const gap = Math.round(((emp.salary / p50) - 1) * 100);
    return { name: emp.name?.split(' ')[0] || 'Emp', gap };
  }) || [];

  const quickLinks = [
    { label: 'Folha de Pagamento', href: '/snapshots', icon: <FileText size={16} />, desc: 'Upload de snapshot' },
    { label: 'Mapeamento', href: '/job-match', icon: <BookOpen size={16} />, desc: 'Vincular cargos' },
    { label: 'Diagnóstico', href: '/diagnostics', icon: <BarChart2 size={16} />, desc: 'Análise de gaps' },
    { label: 'Estrutura Salarial', href: '/salary-structure', icon: <Layers size={16} />, desc: 'Grades e tabelas' },
    { label: 'Simulador de Mérito', href: '/merit', icon: <Zap size={16} />, desc: 'Ciclo de reajuste' },
    { label: 'Benchmark Explorer', href: '/benchmark', icon: <TrendingUp size={16} />, desc: '1.257 benchmarks reais' },
  ];

  return (
    <div style={{ maxWidth: 1200, paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
              Bom dia, Tobias 👋
            </h1>
            <p style={{ color: '#64748b', fontSize: 17 }}>
              Inteligência salarial da <strong>Lola Tech Ltd</strong> — {stats.lastSnapshotDate}
              {stats.isDemo && (
                <span style={{ marginLeft: 10, fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
                  SEM DADOS
                </span>
              )}
            </p>
          </div>
          <Link href="/snapshots" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} /> Nova Folha
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 32 }}>
          {/* Colaboradores */}
          <div className="card" style={{ borderLeft: '4px solid #4f46e5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: 10, background: '#eef2ff', borderRadius: 10 }}>
                <Users color="#4f46e5" size={22} />
              </div>
              {!stats.isDemo && (
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: 4 }}>
                  REAL
                </span>
              )}
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {stats.totalEmployees}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Colaboradores na folha</div>
          </div>

          {/* Gap vs Mercado */}
          <div className="card" style={{ borderLeft: `4px solid ${gapColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: 10, background: gapColor + '15', borderRadius: 10 }}>
                <TrendingUp color={gapColor} size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: gapColor, background: gapColor + '15', padding: '2px 8px', borderRadius: 4 }}>
                {gapLabel}
              </span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {stats.avgGap > 0 ? '+' : ''}{Number(stats.avgGap).toFixed(1)}%
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Gap médio vs. mercado P50</div>
          </div>

          {/* Custo p/ nivelamento */}
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: 10, background: '#f0fdf4', borderRadius: 10 }}>
                <Zap color="#10b981" size={22} />
              </div>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Estimado</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              R$ {(stats.monthlyCostP50 / 1000).toFixed(1)}k
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Custo mensal para atingir P50</div>
          </div>

          {/* Benchmarks disponíveis */}
          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ padding: 10, background: '#fffbeb', borderRadius: 10 }}>
                <Search color="#f59e0b" size={22} />
              </div>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: 4 }}>
                IMPORTADO
              </span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              1.257
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Benchmarks de mercado (2025)</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Gráfico de Gaps dos Colaboradores */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Gap por Colaborador</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>Posicionamento vs. P50 do mercado</p>
            </div>
            <Link href="/diagnostics" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              Ver detalhes <ArrowRight size={14} />
            </Link>
          </div>

          {distributionData.length > 0 ? (
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Gap']} />
                  <Bar
                    dataKey="gap"
                    radius={[4, 4, 0, 0]}
                    label={false}
                    fill="#4f46e5"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#94a3b8' }}>
              <BarChart2 size={40} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Mapeie cargos para ver os gaps</p>
              <Link href="/job-match" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600 }}>→ Mapeamento</Link>
            </div>
          )}
        </div>

        {/* Ações Recomendadas */}
        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Ações Recomendadas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                icon: <AlertTriangle size={18} color="#ef4444" />,
                bg: '#fff1f2',
                title: stats.avgGap < -10
                  ? `${stats.totalEmployees} colaboradores abaixo do P50`
                  : 'Folha dentro do mercado',
                desc: stats.avgGap < -10 ? 'Simule um ciclo de mérito para nivelamento' : 'Continue monitorando semestralmente',
                href: '/merit',
                cta: 'Simular',
                urgent: stats.avgGap < -10,
              },
              {
                icon: <CheckCircle2 size={18} color="#4f46e5" />,
                bg: '#eef2ff',
                title: 'Explorar benchmarks de 2025',
                desc: '1.257 dados de mercado disponíveis para TI/Software',
                href: '/benchmark',
                cta: 'Explorar',
                urgent: false,
              },
              {
                icon: <Layers size={18} color="#10b981" />,
                bg: '#f0fdf4',
                title: 'Gerar Estrutura Salarial',
                desc: 'Tabela de grades baseada na sua folha atual',
                href: '/salary-structure',
                cta: 'Ver',
                urgent: false,
              },
            ].map((action, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, background: '#f8fafc', border: action.urgent ? '1px solid #fecaca' : '1px solid #f1f5f9' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0, marginBottom: 2 }}>{action.title}</p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.desc}</p>
                </div>
                <Link href={action.href} className="btn" style={{ padding: '6px 14px', background: action.urgent ? '#ef4444' : '#f1f5f9', color: action.urgent ? 'white' : '#1e293b', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {action.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Access + Copilot */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Quick Access */}
        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Acesso Rápido</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0',
                  background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.15s', cursor: 'pointer'
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eef2ff'; (e.currentTarget as HTMLElement).style.borderColor = '#c7d2fe'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ color: '#4f46e5', flexShrink: 0 }}>{link.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{link.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{link.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Copilot Carolina */}
        <div className="card" style={{ background: '#0f172a', color: 'white', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🤖
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Carolina</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Copilot de Inteligência Salarial</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
            Olá, Tobias! Tenho <strong style={{ color: 'white' }}>{stats.totalEmployees} colaboradores</strong> e <strong style={{ color: 'white' }}>1.257 benchmarks</strong> carregados. Como posso ajudar?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              '📊 Quem está mais abaixo do P50?',
              '💰 Custo para nivelar todos ao mercado',
              '🔍 Cargo com maior gap',
              '📈 Simular reajuste de 8%',
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => setCopilotInput(q.slice(3))}
                style={{
                  padding: '8px 12px', background: '#1e293b', color: '#e2e8f0',
                  fontSize: 11, textAlign: 'left', border: '1px solid #334155',
                  borderRadius: 8, cursor: 'pointer', lineHeight: 1.4
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Pergunte à Carolina..."
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                background: '#1e293b', border: '1px solid #334155',
                color: 'white', fontSize: 14, outline: 'none'
              }}
            />
            <button
              className="btn btn-primary"
              style={{ padding: '12px 18px', borderRadius: 10, flexShrink: 0 }}
            >
              ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

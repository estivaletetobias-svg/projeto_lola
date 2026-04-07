'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Users, TrendingUp, Zap, FileText,
  AlertTriangle, CheckCircle2, ArrowRight, Search,
  Layers, BookOpen, Loader2, Sparkles, Target, 
  ChevronRight, BrainCircuit, Activity, Globe,
  ArrowUpRight, ArrowDownRight, Gem, History
} from 'lucide-react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area, Cell
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
      fetch(`http://${host}:3001/diagnostics/dashboard-stats`).then(r => r.json()).catch(() => null),
      fetch(`http://${host}:3001/payroll/snapshots?tenantId=default`).then(r => r.json()).catch(() => []),
    ]).then(async ([dashStats, snaps]) => {
      if (dashStats && !dashStats.error) {
        setStats({
          ...dashStats,
          lastSnapshotDate: dashStats.lastSnapshotDate
            ? new Date(dashStats.lastSnapshotDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : '—'
        });
      }
      if (snaps?.length > 0) {
        try {
          const res = await fetch(`http://${host}:3001/salary-engine/analyze/${snaps[0].id}`);
          const result = await res.json();
          if (result.status === 'success') setAnalysis(result);
        } catch (_) { }
      }
      setLoading(false);
    });
  }, []);

  const distributionData = analysis?.mappedEmployees?.map((emp: any) => {
    const struct = analysis.suggestedSalaryStructure?.find((s: any) => s.grade === `G${emp.grade}`);
    const p50 = struct?.midpoint || 1;
    const gap = Math.round(((emp.salary / p50) - 1) * 100);
    return { name: emp.name?.split(' ')[0] || 'Emp', gap };
  }) || [];

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  const kpis = [
    { label: 'Total Headcount', val: stats.totalEmployees, icon: <Users size={20} />, color: '#6366f1', trend: '+2.4%', sub: 'vs last month' },
    { label: 'Payroll Variance', val: `${stats.avgGap > 0 ? '+' : ''}${Number(stats.avgGap).toFixed(1)}%`, icon: <Activity size={20} />, color: stats.avgGap < -10 ? '#f43f5e' : '#10b981', trend: 'Déficit', sub: 'Market Gap Avg' },
    { label: 'Cost of Parity', val: `R$ ${(stats.monthlyCostP50 / 1000).toFixed(1)}k`, icon: <Gem size={20} />, color: '#818cf8', trend: 'P50 Target', sub: 'Monthly Impact' },
    { label: 'Market Intel', val: '1.2M', icon: <Globe size={20} />, color: '#f59e0b', trend: 'Benchmarks', sub: 'Active Catalog' }
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={containerVars} style={{ maxWidth: 1300, paddingBottom: 100 }}>
      {/* Dynamic Header */}
      <motion.div variants={itemVars} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 56 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ background: '#6366f115', color: '#818cf8', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} /> Intelligence Center Active
            </div>
            {stats.isDemo && <span style={{ fontSize: 10, background: '#fbbf2420', color: '#f59e0b', padding: '4px 10px', borderRadius: 20, fontWeight: 900, border: '1px solid #fbbf2420' }}>DEMO MODE</span>}
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 950, color: '#f8fafc', letterSpacing: '-0.04em', lineHeight: 1 }}>
            Olá, Carolina. <br/>
            <span style={{ color: '#64748b' }}>Seu RH estrategicamente pronto.</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', color: '#94a3b8', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <History size={16} /> Audit Log
          </button>
          <Link href="/snapshots" className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: 14, fontWeight: 900, fontSize: 13, boxShadow: '0 10px 25px rgba(99,102,241,0.2)' }}>
            Processar Snapshot
          </Link>
        </div>
      </motion.div>

      {/* Strategic KPIs Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i} variants={itemVars} 
            whileHover={{ y: -5, background: 'rgba(255,255,255,0.03)' }}
            className="card" style={{ padding: '28px', border: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.3s ease' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${kpi.color}15`, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
              <div style={{ fontSize: 10, fontWeight: 950, color: kpi.color, background: `${kpi.color}10`, padding: '4px 8px', borderRadius: 6 }}>{kpi.trend}</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 950, color: '#f1f5f9', marginBottom: 4, letterSpacing: '-0.03em' }}>{kpi.val}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 2 }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 48 }}>
        <motion.div variants={itemVars} className="card" style={{ padding: 40, background: 'rgba(22, 32, 50, 0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 950, color: '#f8fafc', marginBottom: 6 }}>Market Gap Distribution</h3>
              <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Desvio percentual individual vs. benchmarks vigentes.</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: '#64748b' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: '#6366f1' }} /> GAP ATIVO
               </div>
            </div>
          </div>

          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 800 }} unit="%" />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ background: '#0f1c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 900 }}
                />
                <Bar dataKey="gap" radius={[4, 4, 0, 0]} barSize={24}>
                  {distributionData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.gap < -10 ? '#f43f5e' : entry.gap > 10 ? '#818cf8' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVars} style={{ display: 'grid', gridAutoRows: '1fr', gap: 24 }}>
          <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f43f5e15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle color="#f43f5e" size={20} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>Critical Actions</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <Link href="/job-match" style={{ textDecoration: 'none' }}>
                 <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#f1f5f9' }}>Auditoria de Mapeamento</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Existem cargos não pareados.</div>
                    </div>
                    <ArrowRight size={14} color="#64748b" />
                 </div>
               </Link>
               <Link href="/merit" style={{ textDecoration: 'none' }}>
                 <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#f1f5f9' }}>Correção de Déficit</div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>12 colabs com alto turnover por salário.</div>
                    </div>
                    <ArrowRight size={14} color="#64748b" />
                 </div>
               </Link>
            </div>
          </div>

          <div className="card" style={{ padding: 32, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ fontSize: 11, fontWeight: 950, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Ready for Strategy</div>
              <h3 style={{ fontSize: 24, fontWeight: 950, marginBottom: 12 }}>Ativar Ciclo de Mérito</h3>
              <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 20 }}>Deseja simular um ciclo de 5% de correção baseado no gap de mercado atual? </p>
              <Link href="/merit" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', color: '#4f46e5', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 900, textDecoration: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                Iniciar Simulação <Zap size={16} fill="currentColor" />
              </Link>
            </div>
            <Sparkles size={80} style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.1 }} />
          </div>
        </motion.div>
      </div>

      {/* Carolina AI Copilot Premium Interface */}
      <motion.div variants={itemVars} style={{ background: '#0f1c2e', borderRadius: 32, padding: 48, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(99, 102, 241, 0.3)' }}>
                <BrainCircuit size={28} color="white" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 950, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Carolina AI</h3>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: '#10b981' }} />
                </div>
                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>Compensation Copilot</p>
              </div>
            </div>

            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, marginBottom: 40, maxWidth: '85%' }}>
              Carolina, analisei a saúde retentiva da Lola Tech. Identifiquei que <strong style={{ color: '#f8fafc' }}>12 colaboradores de Tech</strong> operam com um déficit médio de <strong style={{ color: '#fb7185' }}>-18.4%</strong> vs market P50. <br/>
              A probabilidade de turnover voluntário neste cluster subiu para <strong style={{ color: '#fb7185' }}>65%</strong> este trimestre.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
              {[
                { l: 'Listar cargos críticos', i: <Target size={14} /> },
                { l: 'Impacto financeiro de 5%', i: <Activity size={14} /> },
                { l: 'Gerar Battlecard de Retenção', i: <Gem size={14} /> }
              ].map((q, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setCopilotInput(q.l)}
                  style={{ 
                    padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0', fontSize: 13, 
                    fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = '#6366f1'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                >
                  {q.i} {q.l}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text"
                placeholder="Questione Carolina sobre estratégia ou projeções financeiras..."
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                style={{ 
                  width: '100%', padding: '24px 80px 24px 32px', borderRadius: 24, 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', fontSize: 16, fontWeight: 600, outline: 'none',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{ position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, background: '#6366f1', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ArrowRight size={20} color="white" />
              </div>
            </div>
          </div>
      </motion.div>
    </motion.div>
  );
}

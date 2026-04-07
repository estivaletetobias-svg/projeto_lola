'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, TrendingUp, DollarSign, Target,
  AlertTriangle, CheckCircle2, ArrowRight, Search,
  Layers, BookOpen, Loader2, Sparkles,
  ChevronRight, BrainCircuit, Activity, Globe,
  ArrowUpRight, ArrowDownRight, Gem, History,
  RefreshCw, Filter, LayoutGrid, ListChecks
} from 'lucide-react';
import Link from 'next/link';
import { getBackendUrl } from './api-config';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    avgSalary: 0,
    monthlyCost: 0,
    criticalGaps: 0,
    mappedRoles: 0,
    costTrend: 0,
    healthScore: 0,
    salaryGrowth: 0,
    turnoverRisk: 0,
  });

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copilotInput, setCopilotInput] = useState('');
  const [snapshotId, setSnapshotId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const baseUrl = getBackendUrl();
      const [dashStats, snaps] = await Promise.all([
        fetch(`${baseUrl}/diagnostics/dashboard-stats`).then(r => r.json()).catch(() => null),
        fetch(`${baseUrl}/payroll/snapshots?tenantId=default`).then(r => r.json()).catch(() => []),
      ]);

      if (dashStats && !dashStats.error) {
        setStats({
          ...dashStats,
          monthlyCost: dashStats.monthlyCost 
            ? (dashStats.monthlyCost / 1000000) 
            : 0
        });
      }
      
      if (snaps?.length > 0) {
        const sid = snaps[0].id;
        setSnapshotId(sid);
        try {
          const res = await fetch(`${baseUrl}/salary-engine/analyze/${sid}`);
          const result = await res.json();
          if (result.status === 'success') setAnalysis(result);
        } catch (_) { }
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const menuItems = [
    { title: 'Intelligence Center', icon: <BrainCircuit size={20} />, active: true, path: '/' },
    { title: 'Folha de Pagamento', icon: <History size={20} />, path: '/snapshots' },
    { title: 'Mapeamento AI', icon: <Activity size={20} />, path: '/job-match' },
    { title: 'Diagnóstico Pro', icon: <TrendingUp size={20} />, path: '/diagnostics' },
    { title: 'Estrutura de Grades', icon: <Layers size={20} />, path: '/salary-structure' },
    { title: 'Simulador de Mérito', icon: <DollarSign size={20} />, path: '/merit' },
  ];

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Loader2 size={48} className="animate-spin" color="#4f46e5" />
        <p style={{ fontWeight: 600, color: '#64748b' }}>Sincronizando inteligência salarial...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVars}
      initial="hidden"
      animate="show"
      style={{ paddingBottom: 100 }}
    >
      {/* Header Strategy */}
      <motion.div variants={itemVars} style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '4px 10px', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>v1.4 Premium Edition</div>
            <div style={{ padding: '4px 10px', background: '#f0f9ff', color: '#0ea5e9', borderRadius: 20, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe size={12} /> Live Market Sync
            </div>
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
            Olá, Carolina.<br />
            <span style={{ color: '#64748b' }}>Seu Painel de Inteligência Estratégica.</span>
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" style={{ padding: '12px 20px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} /> Histórico
          </button>
          <button onClick={fetchData} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(79,70,229,0.1)' }}>
            <RefreshCw size={18} /> Atualizar Dashboard
          </button>
        </div>
      </motion.div>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
        {[
          { label: 'Colaboradores', value: stats.totalEmployees, trend: '+4%', icon: <Users size={20} />, color: '#4f46e5' },
          { label: 'Custo Mensal (Folha)', value: `R$ ${stats.monthlyCost.toFixed(1)}M`, trend: '-0.8%', icon: <DollarSign size={20} />, color: '#10b981' },
          { label: 'Saúde Salarial', value: `${stats.healthScore}%`, trend: '+2.1%', icon: <Target size={20} />, color: '#8b5cf6' },
          { label: 'Gap de Mercado', value: stats.criticalGaps ? `-${stats.criticalGaps}%` : '0%', trend: 'Estável', icon: <TrendingUp size={20} />, color: '#f59e0b' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            variants={itemVars}
            className="card"
            style={{ padding: 28, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stat.color}10`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: stat.trend.startsWith('+') ? '#10b981' : stat.trend === 'Estável' ? '#64748b' : '#ef4444', background: stat.trend.startsWith('+') ? '#10b98110' : '#334155', padding: '4px 8px', borderRadius: 6, height: 'fit-content' }}>
                {stat.trend}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{stat.value}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 4, background: `${stat.color}10` }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ delay: 0.5 + idx * 0.1 }} style={{ height: '100%', background: stat.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Chart Section */}
          <motion.div variants={itemVars} className="card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1e293b' }}>Diagnóstico de Equidade</h3>
                <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Distribuição por Grade vs Mercado</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5' }} /> Real
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#64748b', marginLeft: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e2e8f0' }} /> Target
                 </div>
              </div>
            </div>
            
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis?.diagnostics?.gradeDistribution?.slice(0, 8) || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', padding: 16 }}
                  />
                  <Bar dataKey="salary" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* AI Copilot Input */}
          <motion.div variants={itemVars} className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
               <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Sparkles size={22} color="white" />
               </div>
               <div>
                 <h3 style={{ fontSize: 16, fontWeight: 800 }}>Carolina Copilot</h3>
                 <p style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>Tire dúvidas estratégicas sobre sua folha</p>
               </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Ex: 'Quais cargos estão com maior desvio de mercado?'"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 600, fontSize: 14, outline: 'none' }}
              />
              <button style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'white', color: '#4f46e5', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                Consultar AI
              </button>
            </div>
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Quick Access Sidebar */}
          <motion.div variants={itemVars} className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <LayoutGrid size={18} color="#4f46e5" /> Acessos Rápidos
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {menuItems.slice(1).map((item) => (
                <Link key={item.path} href={item.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, textDecoration: 'none', transition: 'all 0.2s' }} className="nav-item">
                  <div style={{ color: '#94a3b8' }}>{item.icon}</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>{item.title}</span>
                  <ChevronRight size={14} style={{ marginLeft: 'auto', color: '#64748b' }} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Action Alerts */}
          <motion.div variants={itemVars} className="card" style={{ padding: 24, background: '#fffbeb', border: '1px solid #fde68a' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#92400e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#f59e0b" /> Prioridades Críticas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Desvio em Tech', desc: 'Sênior Devs 12% abaixo do mercado', priority: 'HIGH' },
                { label: 'Cura de Dados', desc: '4 colaboradores não mapeados', priority: 'MED' },
              ].map((alert) => (
                <div key={alert.label}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{alert.label}</div>
                  <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>{alert.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/job-match" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: 12, fontWeight: 800, color: '#d97706', textDecoration: 'none' }}>
              Resolver agora <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

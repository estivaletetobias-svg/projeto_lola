'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Users, TrendingUp, Zap, FileText, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [stats, setStats] = useState({
    totalEmployees: 30,
    avgGap: -8.4,
    monthlyCostP50: 14200,
    lastSnapshotDate: 'Mar/2026',
    isDemo: true
  });

  useEffect(() => {
    fetch('http://localhost:3000/diagnostics/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          ...data,
          lastSnapshotDate: data.lastSnapshotDate
            ? new Date(data.lastSnapshotDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
            : 'N/A'
        });
      })
      .catch(err => console.error('Error fetching stats:', err));
  }, []);

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Bem-vindo, Tobias</h1>
        <p style={{ color: '#64748b', fontSize: 18 }}>
          Aqui está o status da inteligência salarial da <strong>Lola Tech Ltd</strong>.
          {stats.isDemo && <span style={{ marginLeft: 12, fontSize: 12, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 4 }}>DEMO MODE</span>}
        </p>
      </div>

      <div className="grid-4" style={{ marginBottom: 40 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ padding: 8, background: '#eef2ff', borderRadius: 8 }}><Users color="#4f46e5" size={20} /></div>
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{stats.isDemo ? '+2 este mês' : 'Atualizado'}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.totalEmployees}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Colaboradores Ativos</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ padding: 8, background: '#fef2f2', borderRadius: 8 }}><TrendingUp color="#ef4444" size={20} /></div>
            <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{stats.avgGap < -10 ? 'Ação Necessária' : 'Monitorando'}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.avgGap}%</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Gap Médio vs Mercado</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ padding: 8, background: '#f0fdf4', borderRadius: 8 }}><Zap color="#10b981" size={20} /></div>
            <span style={{ fontSize: 12, color: '#64748b' }}>Sugerido</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>R$ {(stats.monthlyCostP50 / 1000).toFixed(1)}k</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Custo mensal p/ P50</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ padding: 8, background: '#fffbeb', borderRadius: 8 }}><FileText color="#f59e0b" size={20} /></div>
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>95% match</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, textTransform: 'capitalize' }}>{stats.lastSnapshotDate}</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Último Snapshot</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Ações Recomendadas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, background: '#f8fafc' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <CheckCircle size={20} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Revisar 4 cargos com baixo match</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Área de Produto e Operações</p>
              </div>
              <Link href="/job-match" className="btn" style={{ padding: '6px 12px', background: '#f1f5f9', fontSize: 12 }}>Abrir</Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, background: '#f8fafc' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <Zap size={20} color="#4f46e5" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Simular ciclo de mérito anual</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Base Março/2026</p>
              </div>
              <Link href="/merit" className="btn" style={{ padding: '6px 12px', background: '#f1f5f9', fontSize: 12 }}>Abrir</Link>
            </div>
          </div>
        </div>

        <div className="card" style={{ background: '#111827', color: 'white' }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Copilot SinSalarial</h3>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>Sou sua inteligência artificial focada em remuneração. Como posso ajudar hoje?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btn" style={{ background: '#1f2937', color: 'white', fontSize: 12, textAlign: 'left', border: '1px solid #374151' }}>
              "Quais áreas estão mais abaixo do mercado?"
            </button>
            <button className="btn" style={{ background: '#1f2937', color: 'white', fontSize: 12, textAlign: 'left', border: '1px solid #374151' }}>
              "Média salarial de Engenheiros Senior"
            </button>
          </div>
          <div style={{ marginTop: 20, position: 'relative' }}>
            <input
              type="text"
              placeholder="Pergunte ao Copilot..."
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, background: '#1f2937', border: '1px solid #374151', color: 'white' }}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}

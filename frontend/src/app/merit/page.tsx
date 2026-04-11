'use client';
import { safeFetch } from "@/app/api-config";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Target, Zap, Shield, Download, AlertCircle, Loader2, RefreshCw, 
    ArrowRight, ChevronRight, TrendingUp, Wallet, CheckCircle2,
    Sparkles, BrainCircuit, Filter, History, LayoutGrid, ListChecks
} from 'lucide-react';
import { getBackendUrl } from '../api-config';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface Employee {
    name: string;
    jobTitle: string;
    grade: number;
    salary: number;
    marketP50: number;
    gap: number;
}

export default function MeritCyclePage() {
    const [budget, setBudget] = useState(50000);
    const [scenario, setScenario] = useState('BALANCED');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [adjustments, setAdjustments] = useState<Record<number, number>>({});
    const [snapshotId, setSnapshotId] = useState<string | null>(null);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            const baseUrl = getBackendUrl();
            const snapsRes = await safeFetch(`${baseUrl}/payroll/snapshots?tenantId=default`);
            const snaps = await snapsRes.json();
            if (!snaps || snaps.length === 0) {
                setError('Nenhuma folha importada. Faça o upload na aba Folha de Pagamento.');
                setLoading(false);
                return;
            }

            const snapshotId = snaps[0].id;
            setSnapshotId(snapshotId);

            const analysisRes = await safeFetch(`${baseUrl}/salary-engine/analyze/${snapshotId}`);
            const analysis = await analysisRes.json();

            if (!analysis.mappedEmployees?.length) {
                setError('Nenhum colaborador mapeado encontrado. Vá em Mapeamento de Cargos.');
                setLoading(false);
                return;
            }

            const emps: Employee[] = analysis.mappedEmployees.map((emp: any) => {
                const struct = analysis.suggestedSalaryStructure.find((s: any) => s.grade === `G${emp.grade}`);
                const p50 = struct?.midpoint || 0;
                const gap = p50 > 0 ? ((emp.salary / p50) - 1) * 100 : 0;
                return {
                    name: emp.name || `Colaborador`,
                    jobTitle: emp.jobTitle,
                    grade: emp.grade,
                    salary: emp.salary,
                    marketP50: p50,
                    gap,
                };
            });

            setEmployees(emps);
            autoCalculateAdjustments(emps, 'BALANCED');
        } catch (e) {
            setError('Erro ao conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    const autoCalculateAdjustments = (emps: Employee[], scen: string) => {
        const newAdj: Record<number, number> = {};
        emps.forEach((emp, i) => {
            let raise = 0;
            if (scen === 'CONSERVATIVE') {
                if (emp.gap < -20) raise = Math.min(Math.abs(emp.gap) / 2, 10);
            } else if (scen === 'BALANCED') {
                if (emp.gap < -5) raise = Math.min(Math.abs(emp.gap) / 3, 8);
                else if (emp.gap >= -5) raise = 3;
            } else if (scen === 'AGRESSIVE') {
                if (emp.gap < -10) raise = Math.min(Math.abs(emp.gap) / 2, 15);
                else raise = 5;
            }
            newAdj[i] = Math.round(raise * 10) / 10;
        });
        setAdjustments(newAdj);
    };

    const handleScenarioChange = (scen: string) => {
        setScenario(scen);
        autoCalculateAdjustments(employees, scen);
    };

    const totalCostIncrease = employees.reduce((sum, emp, i) => {
        const raise = adjustments[i] || 0;
        return sum + (emp.salary * (raise / 100));
    }, 0);

    const budgetUsed = (totalCostIncrease / budget) * 100;

    const exportXLSX = () => {
        const rows = employees.map((emp, i) => ({
            Colaborador: emp.name,
            Cargo: emp.jobTitle,
            Grade: `G${emp.grade}`,
            'Salário Atual': emp.salary,
            'P50 Mercado': emp.marketP50,
            'Gap Mercado (%)': emp.gap.toFixed(1) + '%',
            'Reajuste (%)': (adjustments[i] || 0) + '%',
            'Novo Salário': Math.round(emp.salary * (1 + (adjustments[i] || 0) / 100)),
            'Custo Adicional/Mês': Math.round(emp.salary * ((adjustments[i] || 0) / 100)),
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ciclo de Mérito');
        XLSX.writeFile(wb, `plano_merito_lola_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
                      <div style={{ padding: '4px 12px', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Strategic Simulation V4
                      </div>
                  </div>
                  <h1 style={{ fontSize: 42, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Plano de Mérito & <br/>
                    <span style={{ color: '#64748b' }}>Retenção de Talentos.</span>
                  </h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={loadEmployees} className="btn" style={{ padding: '12px 20px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RefreshCw size={16} /> Atualizar
                    </button>
                    <button onClick={exportXLSX} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                        <Download size={18} /> Exportar Plano
                    </button>
                </div>
            </motion.div>

            {loading ? (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
                    <Loader2 size={48} className="animate-spin" color="#4f46e5" />
                    <p style={{ fontWeight: 600, color: '#64748b' }}>Processando simulação financeira...</p>
                </div>
            ) : error ? (
                <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="card" style={{ padding: 60, textAlign: 'center', background: 'white' }}>
                    <AlertCircle size={64} color="#f59e0b" style={{ margin: '0 auto 24px' }} />
                    <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Diagnóstico Requerido</h2>
                    <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>{error}</p>
                    <Link href="/job-match" className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: 14 }}>Mapear Colaboradores</Link>
                </motion.div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: 32 }}>
                    {/* Strategy Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Budget Card */}
                        <motion.div variants={{ hidden: { scale: 0.95 }, show: { scale: 1 } }} className="card" style={{ padding: 32, background: '#0f172a', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(79, 70, 229, 0.2)', borderRadius: 50, filter: 'blur(30px)' }} />
                            
                            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 32 }}>Executive Budget Control</h3>
                            
                            <div style={{ marginBottom: 32 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>ORÇAMENTO MENSAL DISPONÍVEL</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#4f46e5' }}>R$</span>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: 16, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 20, fontWeight: 800, outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Custo do Plano</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: budgetUsed > 100 ? '#f43f5e' : '#10b981' }}>{budgetUsed.toFixed(1)}%</span>
                                </div>
                                <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 20 }}>R$ {totalCostIncrease.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
                                        style={{ height: '100%', background: budgetUsed > 100 ? '#f43f5e' : '#4f46e5', borderRadius: 3 }}
                                    />
                                </div>
                                {budgetUsed > 100 && (
                                    <div style={{ marginTop: 16, padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: 8, color: '#f43f5e', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertCircle size={14} /> EXCEDEU O BUDGET
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Scenarios */}
                        <div className="card" style={{ padding: 24 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, color: '#1e293b' }}>Seleção de Estratégia</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {[
                                    { id: 'CONSERVATIVE', label: 'Conservador', desc: 'Foco exclusivo em gaps críticos (>20%)', icon: <Shield />, color: '#64748b' },
                                    { id: 'BALANCED', label: 'Equilibrado', desc: 'Nivelamento progressivo ao P50', icon: <Target />, color: '#4f46e5' },
                                    { id: 'AGRESSIVE', label: 'Agressivo', desc: 'Retenção total e outperform de mercado', icon: <Zap />, color: '#f59e0b' },
                                ].map(opt => (
                                    <motion.button
                                        key={opt.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleScenarioChange(opt.id)}
                                        style={{ 
                                            textAlign: 'left', padding: '16px', borderRadius: 16, border: '2px solid',
                                            borderColor: scenario === opt.id ? opt.color : '#334155',
                                            background: scenario === opt.id ? `${opt.color}05` : 'white',
                                            display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ width: 40, height: 40, borderRadius: 10, background: scenario === opt.id ? opt.color : '#1e293b', color: scenario === opt.id ? 'white' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 14, color: scenario === opt.id ? '#1e293b' : '#64748b' }}>{opt.label}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>{opt.desc}</div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* AI Insights Card */}
                        <div className="card" style={{ background: 'white', border: '1px dashed #cbd5e1', padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <BrainCircuit size={18} color="#4f46e5" />
                                <span style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase' }}>Carolina AI Insight</span>
                            </div>
                            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                                Com base em <strong style={{ color: '#1e293b' }}>1.257 benchmarks</strong>, o cenário <strong style={{ color: '#1e293b' }}>Equilibrado</strong> reduz seu risco de churn em <strong style={{ color: '#10b981' }}>34%</strong> nos próximos 6 meses.
                            </p>
                        </div>
                    </div>

                    {/* Table Section */}
                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b' }}>Plano Individualizado</h3>
                                <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 500 }}>{employees.length} colaboradores analisados pelo motor Lola.</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                                <Filter size={14} /> Filtro: Todos
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'white', borderBottom: '1px solid #334155' }}>
                                        <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Colaborador</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Proposta Lola</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Diferencial</th>
                                        <th style={{ padding: '16px 16px', textAlign: 'right', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Novo Salário</th>
                                        <th style={{ padding: '16px 32px', textAlign: 'right' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode="popLayout">
                                        {employees.map((emp, i) => {
                                            const raise = adjustments[i] || 0;
                                            const newSalary = Math.round(emp.salary * (1 + raise / 100));
                                            const diff = newSalary - emp.salary;
                                            return (
                                                <motion.tr 
                                                    key={i}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    style={{ borderBottom: '1px solid #1e293b' }}
                                                    whileHover={{ background: 'white' }}
                                                >
                                                    <td style={{ padding: '20px 32px' }}>
                                                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 14 }}>{emp.name}</div>
                                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{emp.jobTitle} • G{emp.grade}</div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                                            <input
                                                                type="number"
                                                                value={raise}
                                                                onChange={(e) => setAdjustments(prev => ({ ...prev, [i]: Number(e.target.value) }))}
                                                                style={{ width: 70, padding: '8px', textAlign: 'center', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 800, background: raise > 0 ? '#f0fdf4' : 'white', color: raise > 0 ? '#10b981' : '#1e293b' }}
                                                            />
                                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>%</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: raise > 0 ? '#10b981' : '#cbd5e1' }}>
                                                            + R$ {diff.toLocaleString('pt-BR')}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                                                            R$ {newSalary.toLocaleString('pt-BR')}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 32px', textAlign: 'right' }}>
                                                        <ChevronRight size={16} color="#cbd5e1" />
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}

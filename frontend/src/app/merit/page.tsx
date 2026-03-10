'use client';

import { useState, useEffect } from 'react';
import { Target, Zap, Shield, Download, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
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

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        setError('');
        try {
            const host = window.location.hostname;

            // Busca o snapshot mais recente
            const snapsRes = await fetch(`http://${host}:3000/payroll/snapshots?tenantId=default`);
            const snaps = await snapsRes.json();
            if (!snaps || snaps.length === 0) {
                setError('Nenhuma folha importada. Faça o upload na aba Folha de Pagamento.');
                setLoading(false);
                return;
            }

            const snapshotId = snaps[0].id;
            const analysisRes = await fetch(`http://${host}:3000/salary-engine/analyze/${snapshotId}`);
            const analysis = await analysisRes.json();

            if (analysis.status !== 'success' || !analysis.mappedEmployees?.length) {
                setError('Nenhum colaborador mapeado encontrado. Vá em Mapeamento de Cargos e vincule os cargos da sua folha.');
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
            // Calcular ajustes automáticos baseados no cenário BALANCED
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
                // Só ajusta quem está mais de 20% abaixo
                if (emp.gap < -20) raise = Math.min(Math.abs(emp.gap) / 2, 10);
            } else if (scen === 'BALANCED') {
                // Ajusta quem está abaixo do P50
                if (emp.gap < -5) raise = Math.min(Math.abs(emp.gap) / 3, 8);
                else if (emp.gap >= -5) raise = 3; // Mérito padrão
            } else if (scen === 'AGRESSIVE') {
                // Todos recebem algum ajuste, prioridade para quem está abaixo
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
        XLSX.writeFile(wb, `ciclo_merito_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div style={{ maxWidth: 1100, paddingBottom: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Simulador de Ciclo de Mérito</h1>
                    <p style={{ color: '#64748b' }}>Defina o orçamento, escolha o cenário e export o plano.</p>
                </div>
                {employees.length > 0 && (
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={loadEmployees} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <RefreshCw size={16} /> Recarregar
                        </button>
                        <button onClick={exportXLSX} className="btn btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Download size={18} /> Exportar XLSX
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 16px', color: '#4f46e5' }} />
                    <p style={{ color: '#64748b' }}>Carregando dados dos colaboradores...</p>
                </div>
            ) : error ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 32px' }}>
                    <AlertCircle size={48} color="#fbbf24" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Dados Insuficientes</h3>
                    <p style={{ color: '#64748b', fontSize: 15, maxWidth: 500, margin: '0 auto 24px' }}>{error}</p>
                    <a href="/job-match" style={{ color: '#4f46e5', fontWeight: 600 }}>→ Ir para Mapeamento de Cargos</a>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 }}>
                    {/* Controles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="card">
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Configurações</h3>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Orçamento Total (R$)</label>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <label style={{ fontSize: 13, fontWeight: 600 }}>Estratégia</label>
                                {[
                                    { id: 'CONSERVATIVE', label: 'Conservador', desc: 'Só ajusta quem está muito abaixo', icon: <Shield size={16} /> },
                                    { id: 'BALANCED', label: 'Equilibrado', desc: 'Prioriza quem está abaixo do P50', icon: <Target size={16} /> },
                                    { id: 'AGRESSIVE', label: 'Agressivo', desc: 'Todos recebem, foco em retenção', icon: <Zap size={16} /> },
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        className={`btn ${scenario === opt.id ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => handleScenarioChange(opt.id)}
                                        style={{ textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px' }}
                                    >
                                        <span style={{ marginTop: 2 }}>{opt.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>{opt.label}</div>
                                            <div style={{ fontSize: 11, opacity: 0.75 }}>{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Resumo do Orçamento */}
                        <div className="card" style={{ background: budgetUsed > 100 ? '#fff1f2' : budgetUsed > 80 ? '#fffbeb' : '#f0fdf4', border: 'none' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>CUSTO DO CICLO</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>
                                R$ {totalCostIncrease.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ fontSize: 13, color: budgetUsed > 100 ? '#ef4444' : '#64748b' }}>
                                {budgetUsed.toFixed(0)}% do orçamento de R$ {budget.toLocaleString()}
                            </div>
                            <div style={{ marginTop: 12, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(budgetUsed, 100)}%`,
                                    background: budgetUsed > 100 ? '#ef4444' : budgetUsed > 80 ? '#f59e0b' : '#10b981',
                                    borderRadius: 4, transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Tabela de Colaboradores */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Plano de Reajuste — {employees.length} colaboradores</h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b' }}>COLABORADOR</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b' }}>SALÁRIO ATUAL</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b' }}>GAP MERCADO</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>REAJUSTE %</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#64748b' }}>NOVO SALÁRIO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp, i) => {
                                    const raise = adjustments[i] || 0;
                                    const newSalary = Math.round(emp.salary * (1 + raise / 100));
                                    return (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{emp.jobTitle} · G{emp.grade}</div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontSize: 14 }}>
                                                R$ {emp.salary.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <span style={{
                                                    fontSize: 13, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                                    color: emp.gap < -10 ? '#ef4444' : emp.gap > 10 ? '#10b981' : '#f59e0b',
                                                    background: emp.gap < -10 ? '#fff1f2' : emp.gap > 10 ? '#f0fdf4' : '#fffbeb',
                                                }}>
                                                    {emp.gap > 0 ? '+' : ''}{emp.gap.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                                    <input
                                                        type="number"
                                                        value={raise}
                                                        onChange={(e) => setAdjustments(prev => ({ ...prev, [i]: Number(e.target.value) }))}
                                                        style={{ width: 60, padding: '6px 8px', textAlign: 'center', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700 }}
                                                        min={0} max={50} step={0.5}
                                                    />
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: raise > 0 ? '#10b981' : '#1e293b' }}>
                                                R$ {newSalary.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

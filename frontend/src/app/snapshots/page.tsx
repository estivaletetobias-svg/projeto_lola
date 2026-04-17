'use client';
import { safeFetch } from "@/app/api-config";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, CheckCircle, AlertCircle,
    Loader2, Download, Zap, ChevronRight,
    Layers, ArrowRight, ShieldCheck, Brain,
    BarChart3, BookOpen, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

interface FileState {
    file: File | null;
    name: string;
    recordCount: number;
    status: 'idle' | 'reading' | 'ready' | 'error';
}

const EMPTY_FILE: FileState = { file: null, name: '', recordCount: 0, status: 'idle' };

export default function SnapshotsPage() {
    const [step, setStep] = useState(1); // 1: Upload, 2: Confirm, 3: Processing, 4: Done
    const [payroll, setPayroll] = useState<FileState>(EMPTY_FILE);
    const [research, setResearch] = useState<FileState>(EMPTY_FILE);
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const [analyzePhase, setAnalyzePhase] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [resultCount, setResultCount] = useState(0);
    const [researchImported, setResearchImported] = useState(0);

    const payrollRef = useRef<HTMLInputElement>(null);
    const researchRef = useRef<HTMLInputElement>(null);

    // ── File handlers ────────────────────────────────────────────
    const handleFile = (
        file: File,
        setter: (s: FileState) => void
    ) => {
        setter({ file, name: file.name, recordCount: 0, status: 'reading' });
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'xlsx' || ext === 'xls') {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                    // Tenta aba de dados ou primeira
                    const sheetName = wb.SheetNames.find(n =>
                        n.toLowerCase().includes('cargo') || n.toLowerCase().includes('dados')
                    ) || wb.SheetNames[0];
                    const ws = wb.Sheets[sheetName];
                    const data = XLSX.utils.sheet_to_json(ws);
                    setter(prev => ({ ...prev, recordCount: data.length, status: 'ready' }));
                } catch {
                    setter(prev => ({ ...prev, status: 'ready' }));
                }
            };
            reader.readAsBinaryString(file);
        } else {
            setter(prev => ({ ...prev, status: 'ready' }));
        }
    };

    const handlePayrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f, setPayroll);
    };

    const handleResearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f, setResearch);
    };

    const canProceed = payroll.status === 'ready';

    // ── Main analysis flow ───────────────────────────────────────
    const startAnalysis = async () => {
        if (!payroll.file) return;
        setStep(3);
        setErrorMsg('');
        setAnalyzeProgress(5);

        const progressTick = (target: number, label: string) => {
            setAnalyzePhase(label);
            return new Promise<void>(resolve => {
                const iv = setInterval(() => {
                    setAnalyzeProgress(prev => {
                        if (prev >= target) { clearInterval(iv); resolve(); return prev; }
                        return Math.min(prev + Math.random() * 6, target);
                    });
                }, 400);
            });
        };

        try {
            // ── 1. Upload & processa pesquisa (se enviada) ──────
            if (research.file) {
                await progressTick(25, 'Processando pesquisa salarial...');
                const resForm = new FormData();
                resForm.append('file', research.file);
                resForm.append('targetHours', '220');
                const resRes = await safeFetch('/api/upload-research', {
                    method: 'POST',
                    body: resForm,
                });
                const resJson = await resRes.json().catch(() => ({}));
                if (resRes.ok) {
                    setResearchImported(resJson.imported || 0);
                }
            }

            // ── 2. Upload & processa folha de pagamento ─────────
            await progressTick(60, 'Extraindo dados da folha com IA...');
            const payForm = new FormData();
            payForm.append('file', payroll.file);
            payForm.append('tenantId', 'default');
            const payRes = await safeFetch('/api/upload-payroll', {
                method: 'POST',
                body: payForm,
            });

            if (!payRes.ok) {
                const err = await payRes.json().catch(() => ({}));
                setErrorMsg(err.error || `Erro ${payRes.status}: processamento da folha falhou.`);
                setStep(2);
                return;
            }

            const payJson = await payRes.json();
            setResultCount(payJson.count || 0);
            if (payJson.employees && typeof window !== 'undefined') {
                localStorage.setItem('@lola-live-employees', JSON.stringify(payJson.employees));
            }

            // ── 3. Finaliza ─────────────────────────────────────
            await progressTick(100, 'Finalizando inteligência salarial...');
            setTimeout(() => setStep(4), 600);

        } catch (err: any) {
            setErrorMsg('Erro de comunicação. Verifique sua conexão e tente novamente.');
            setStep(2);
        }
    };

    const downloadTemplate = () => {
        const data = [
            { id: 1, nome: "Alexandre Rocha", cargo: "Desenvolvedor Backend Sr", salario: 14500.00, carga_horaria: 220 },
            { id: 2, nome: "Carla Mendes", cargo: "Designer de Produto Pl", salario: 8200.00, carga_horaria: 220 },
            { id: 3, nome: "Ricardo Oliveira", cargo: "Gerente de RH", salario: 12800.00, carga_horaria: 220 }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll");
        XLSX.writeFile(wb, "modelo_lola_payroll.xlsx");
    };

    const steps = [
        { id: 1, label: 'Upload' },
        { id: 2, label: 'Confirmação' },
        { id: 3, label: 'Processamento' },
        { id: 4, label: 'Pronto' }
    ];

    // ── Drop zone component ──────────────────────────────────────
    const DropZone = ({
        label, sublabel, icon: Icon, fileState, inputRef,
        accept, onChange, color = '#4f46e5', tag
    }: any) => (
        <div
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = color; }}
            onDragLeave={e => e.currentTarget.style.borderColor = fileState.status === 'ready' ? color : '#e2e8f0'}
            onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) onChange({ target: { files: [f] } } as any);
            }}
            style={{
                border: `2px dashed ${fileState.status === 'ready' ? color : '#e2e8f0'}`,
                borderRadius: 20, padding: '36px 24px', cursor: 'pointer',
                background: fileState.status === 'ready' ? `${color}06` : 'white',
                transition: 'all 0.2s ease', textAlign: 'center', position: 'relative',
                minHeight: 220, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12,
            }}
        >
            {fileState.status === 'ready' && (
                <button
                    onClick={e => { e.stopPropagation(); if (tag === 'payroll') setPayroll(EMPTY_FILE); else setResearch(EMPTY_FILE); }}
                    style={{
                        position: 'absolute', top: 12, right: 12,
                        background: '#fee2e2', border: 'none', borderRadius: 8,
                        padding: 6, cursor: 'pointer', color: '#ef4444',
                        display: 'flex', alignItems: 'center'
                    }}
                ><X size={14} /></button>
            )}

            <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: fileState.status === 'ready' ? `${color}15` : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {fileState.status === 'reading'
                    ? <Loader2 size={26} className="animate-spin" color={color} />
                    : <Icon size={26} color={fileState.status === 'ready' ? color : '#94a3b8'} />
                }
            </div>

            {fileState.status === 'ready' ? (
                <>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', wordBreak: 'break-all', maxWidth: '90%' }}>
                        {fileState.name}
                    </div>
                    {fileState.recordCount > 0 && (
                        <div style={{ fontSize: 12, color, fontWeight: 700 }}>
                            {fileState.recordCount.toLocaleString()} registros detectados
                        </div>
                    )}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: `${color}15`, color, borderRadius: 20,
                        padding: '4px 14px', fontSize: 11, fontWeight: 800,
                    }}>
                        <CheckCircle size={12} /> Pronto para processar
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{sublabel}</div>
                    </div>
                    <div style={{
                        background: color, color: 'white', borderRadius: 12,
                        padding: '10px 22px', fontSize: 13, fontWeight: 800,
                        display: 'inline-flex', alignItems: 'center', gap: 8
                    }}>
                        <Upload size={14} /> Selecionar arquivo
                    </div>
                </>
            )}

            <input ref={inputRef} type="file" style={{ display: 'none' }}
                accept={accept} onChange={onChange} />
        </div>
    );

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 100 }}>
            {/* Header + Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
                        Novo Snapshot
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 16 }}>
                        Carregue a folha de pagamento e a pesquisa salarial para iniciar o diagnóstico.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {steps.map((s, idx) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 10,
                                background: step >= s.id ? '#4f46e5' : '#f1f5f9',
                                color: step >= s.id ? 'white' : '#94a3b8',
                                fontSize: 12, fontWeight: 800, transition: 'all 0.3s ease'
                            }}>
                                {step > s.id ? <CheckCircle size={16} /> : s.id}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: step >= s.id ? '#0f172a' : '#94a3b8' }}>
                                {s.label}
                            </span>
                            {idx < steps.length - 1 && <ChevronRight size={14} color="#cbd5e1" />}
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
                    transition={{ duration: 0.35 }}
                >
                    {/* ── STEP 1: UPLOAD ── */}
                    {step === 1 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
                            <div className="card" style={{ padding: 40, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4f46e5', marginBottom: 8 }}>
                                        Documentos Necessários
                                    </div>
                                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                                        Folha de Pagamento + Pesquisa Salarial
                                    </h2>
                                </div>

                                {/* Dois drop zones lado a lado */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                            📋 Folha de Pagamento <span style={{ color: '#ef4444' }}>*</span>
                                        </div>
                                        <DropZone
                                            tag="payroll"
                                            label="Folha de Pagamento"
                                            sublabel="XLSX, XLS, PDF ou CSV"
                                            icon={FileText}
                                            fileState={payroll}
                                            inputRef={payrollRef}
                                            accept=".xlsx,.xls,.pdf,.csv"
                                            onChange={handlePayrollChange}
                                            color="#4f46e5"
                                        />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                                            📊 Pesquisa Salarial <span style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'none', fontSize: 10 }}>(opcional)</span>
                                        </div>
                                        <DropZone
                                            tag="research"
                                            label="Pesquisa Salarial"
                                            sublabel="XLS ou XLSX da pesquisa SinSalarial"
                                            icon={BarChart3}
                                            fileState={research}
                                            inputRef={researchRef}
                                            accept=".xlsx,.xls"
                                            onChange={handleResearchChange}
                                            color="#10b981"
                                        />
                                    </div>
                                </div>

                                {/* Status bar */}
                                <div style={{
                                    background: '#f8fafc', borderRadius: 14, padding: '14px 20px',
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    border: '1px solid #e2e8f0', marginBottom: 28
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: payroll.status === 'ready' ? '#10b981' : '#e2e8f0' }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Folha de Pagamento</span>
                                        <span style={{ fontSize: 12, color: payroll.status === 'ready' ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
                                            {payroll.status === 'ready' ? '✓ Pronta' : 'Aguardando'}
                                        </span>
                                    </div>
                                    <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: research.status === 'ready' ? '#10b981' : '#f59e0b' }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Pesquisa Salarial</span>
                                        <span style={{ fontSize: 12, color: research.status === 'ready' ? '#10b981' : '#94a3b8', fontWeight: 700 }}>
                                            {research.status === 'ready' ? '✓ Pronta' : 'Opcional'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary"
                                    disabled={!canProceed}
                                    onClick={() => setStep(2)}
                                    style={{
                                        width: '100%', padding: 18, fontSize: 16, fontWeight: 800,
                                        borderRadius: 16, display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: 12,
                                        opacity: canProceed ? 1 : 0.4,
                                        cursor: canProceed ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Revisar e Confirmar <ArrowRight size={18} />
                                </button>
                            </div>

                            {/* Sidebar */}
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <button
                                    onClick={downloadTemplate}
                                    style={{ width: '100%', marginBottom: 20, padding: 24, borderRadius: 20, border: '1px solid #e2e8f0', background: 'white', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ width: 44, height: 44, background: '#eef2ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                                        <Download size={22} color="#4f46e5" />
                                    </div>
                                    <h4 style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Modelo de Folha</h4>
                                    <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>Baixe o formato padrão com a coluna de carga horária incluída.</p>
                                </button>

                                <div className="card" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', padding: 28, borderRadius: 20, color: 'white', border: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <Zap size={18} color="#fbbf24" fill="#fbbf24" />
                                        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Como funciona</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {[
                                            { icon: '📋', label: 'Sobe a folha', desc: 'A IA extrai colaboradores, cargos e salários automaticamente' },
                                            { icon: '📊', label: 'Sobe a pesquisa', desc: 'Os P25/P50/P75 são importados e associados ao benchmark' },
                                            { icon: '🔍', label: 'Diagnóstico', desc: 'O sistema compara internos vs. mercado instantaneamente' },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'white', marginBottom: 2 }}>{item.label}</div>
                                                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* ── STEP 2: CONFIRM ── */}
                    {step === 2 && (
                        <div className="card" style={{ padding: 48, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', marginBottom: 32 }}>
                                Confirmar Documentos
                            </h2>

                            {errorMsg && (
                                <div style={{ marginBottom: 24, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <AlertCircle size={18} /> {errorMsg}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
                                {/* Folha */}
                                <div style={{ padding: 24, background: '#eef2ff', borderRadius: 20, border: '1px solid #c7d2fe' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 40, height: 40, background: '#4f46e5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={20} color="white" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, fontWeight: 900, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Folha de Pagamento</div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{payroll.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {payroll.recordCount > 0 && (
                                            <span style={{ background: '#4f46e520', color: '#4f46e5', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800 }}>
                                                {payroll.recordCount} registros
                                            </span>
                                        )}
                                        <span style={{ background: '#10b98120', color: '#10b981', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800 }}>
                                            ✓ Pronta
                                        </span>
                                    </div>
                                </div>

                                {/* Pesquisa */}
                                <div style={{
                                    padding: 24, borderRadius: 20,
                                    background: research.status === 'ready' ? '#f0fdf4' : '#f8fafc',
                                    border: `1px solid ${research.status === 'ready' ? '#bbf7d0' : '#e2e8f0'}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{ width: 40, height: 40, background: research.status === 'ready' ? '#10b981' : '#94a3b8', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <BarChart3 size={20} color="white" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 10, fontWeight: 900, color: research.status === 'ready' ? '#10b981' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                Pesquisa Salarial
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                                                {research.status === 'ready' ? research.name : 'Não enviada'}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        background: research.status === 'ready' ? '#10b98120' : '#f1f5f9',
                                        color: research.status === 'ready' ? '#10b981' : '#94a3b8',
                                        borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 800
                                    }}>
                                        {research.status === 'ready' ? '✓ Será importada' : 'Usará benchmarks globais'}
                                    </span>
                                </div>
                            </div>

                            {/* Extraction preview */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
                                <div style={{ padding: 24, background: '#f8fafc', borderRadius: 16 }}>
                                    <h4 style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>
                                        Extração Automática (Folha)
                                    </h4>
                                    {['Nome / ID do colaborador', 'Cargo atual', 'Salário base', 'Carga horária (da planilha)'].map(f => (
                                        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{f}</span>
                                            <CheckCircle size={14} color="#10b981" />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ padding: 24, background: '#f8fafc', borderRadius: 16 }}>
                                    <h4 style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: 16, letterSpacing: '0.05em' }}>
                                        Importação (Pesquisa)
                                    </h4>
                                    {['Nome do cargo', 'Senioridade', 'P25 / Mediana / P75', 'N amostras'].map(f => (
                                        <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{f}</span>
                                            <CheckCircle size={14} color={research.status === 'ready' ? '#10b981' : '#cbd5e1'} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <button onClick={() => setStep(1)} style={{ padding: '14px 28px', borderRadius: 14, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                                    ← Voltar
                                </button>
                                <button className="btn btn-primary" onClick={startAnalysis} style={{ flex: 1, padding: 18, fontSize: 16, fontWeight: 800, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                    <Brain size={20} /> Iniciar Processamento
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: PROCESSING ── */}
                    {step === 3 && (
                        <div className="card" style={{ padding: 80, border: 'none', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                            <div style={{ width: 140, height: 140, margin: '0 auto 36px', position: 'relative' }}>
                                <Loader2 className="animate-spin" size={140} color="#4f46e5" strokeWidth={1.5} />
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 900, fontSize: 28, color: '#0f172a' }}>{Math.round(analyzeProgress)}%</div>
                                </div>
                            </div>
                            <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
                                {analyzePhase || 'Iniciando processamento...'}
                            </h3>
                            <p style={{ color: '#64748b', fontSize: 16 }}>
                                Carolina está estruturando os dados para análise de mercado.
                            </p>
                            <div style={{ marginTop: 32, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                <motion.div
                                    animate={{ width: `${analyzeProgress}%` }}
                                    transition={{ ease: 'easeOut' }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 3 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: DONE ── */}
                    {step === 4 && (
                        <div className="card" style={{ padding: 80, border: 'none', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'white', boxShadow: '0 20px 40px rgba(16,185,129,0.2)' }}
                            >
                                <CheckCircle size={52} />
                            </motion.div>
                            <h3 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>
                                Snapshot Processado!
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
                                <div style={{ background: '#eef2ff', borderRadius: 16, padding: '16px 28px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 28, fontWeight: 900, color: '#4f46e5' }}>{resultCount}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>colaboradores na folha</div>
                                </div>
                                {researchImported > 0 && (
                                    <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '16px 28px', textAlign: 'center' }}>
                                        <div style={{ fontSize: 28, fontWeight: 900, color: '#10b981' }}>{researchImported}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>benchmarks da pesquisa</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                                <Link href="/job-match" className="btn btn-primary" style={{ padding: '18px 36px', borderRadius: 16, fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    Mapear Cargos AI <ChevronRight size={20} />
                                </Link>
                                <Link href="/diagnostics" style={{ padding: '18px 36px', borderRadius: 16, fontWeight: 800, fontSize: 16, border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', textDecoration: 'none' }}>
                                    Ver Diagnóstico
                                </Link>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Upload, FileText, CheckCircle, AlertCircle, 
    Loader2, Download, Zap, ChevronRight, 
    Layers, Search, BarChart, ArrowRight,
    ShieldCheck, Brain, File
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

export default function SnapshotsPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Confirm, 3: Processing, 4: Done
    const [fileName, setFileName] = useState('');
    const [fileObj, setFileObj] = useState<File | null>(null);
    const [recordCount, setRecordCount] = useState(0);
    const [analyzeProgress, setAnalyzeProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setFileObj(file);
        setIsUploading(true);
        setErrorMsg('');

        // For Excel: parse client-side just to show record count preview
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'xlsx' || ext === 'xls') {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const data = XLSX.utils.sheet_to_json(ws);
                    setRecordCount(data.length);
                } catch (_) {
                    setRecordCount(0);
                }
                setIsUploading(false);
                setStep(2);
            };
            reader.readAsBinaryString(file);
        } else {
            // For PDF / CSV: we don't know the count until AI processes it
            setRecordCount(0);
            setIsUploading(false);
            setStep(2);
        }
    };

    const startAnalysis = async () => {
        if (!fileObj) return;
        setStep(3);
        setAnalyzeProgress(15);
        setErrorMsg('');

        // Animate progress while AI works
        const progressInterval = setInterval(() => {
            setAnalyzeProgress(prev => {
                if (prev >= 85) { clearInterval(progressInterval); return prev; }
                return prev + Math.random() * 8;
            });
        }, 800);

        try {
            const formData = new FormData();
            formData.append('file', fileObj);
            formData.append('tenantId', 'default');

            const response = await safeFetch('/api/upload-payroll', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (response.ok) {
                const result = await response.json();
                setRecordCount(result.count || 0);
                setAnalyzeProgress(100);
                setTimeout(() => setStep(4), 800);
            } else {
                const err = await response.json().catch(() => ({}));
                setErrorMsg(err.error || `Erro ${response.status}: Processamento falhou.`);
                setStep(2);
            }
        } catch (err: any) {
            clearInterval(progressInterval);
            setErrorMsg('Erro de comunicação. Verifique sua conexão e tente novamente.');
            setStep(2);
        }
    };

    const downloadTemplate = () => {
        const data = [
            { id: 1, nome: "Alexandre Rocha", cargo: "Desenvolvedor Backend Sr", salario: 14500.00 },
            { id: 2, nome: "Carla Mendes", cargo: "Designer de Produto Pl", salario: 8200.00 },
            { id: 3, nome: "Ricardo Oliveira", cargo: "Gerente de RH", salario: 12800.00 }
        ];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll");
        XLSX.writeFile(wb, "modelo_lola_payroll.xlsx");
    };

    const steps = [
        { id: 1, label: 'Upload' },
        { id: 2, label: 'Mapeamento' },
        { id: 3, label: 'Análise AI' },
        { id: 4, label: 'Pronto' }
    ];

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 100 }}>
            {/* Header com Step Indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
                        Snapshot Mensal
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 16 }}>Inicie o ciclo de inteligência salarial carregando sua folha.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {steps.map((s, idx) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 32, height: 32, borderRadius: 10,
                                background: step >= s.id ? '#4f46e5' : '#334155',
                                color: step >= s.id ? 'white' : '#94a3b8',
                                fontSize: 12, fontWeight: 800,
                                transition: 'all 0.3s ease'
                            }}>
                                {step > s.id ? <CheckCircle size={16} /> : s.id}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: step >= s.id ? '#0f172a' : '#94a3b8' }}>{s.label}</span>
                            {idx < steps.length - 1 && <ChevronRight size={14} color="#cbd5e1" />}
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4 }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: step === 1 ? '1fr 340px' : '1fr', gap: 32 }}>
                        {/* Area Principal */}
                        <div className="card" style={{ padding: 48, borderRadius: 24, border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
                            {step === 1 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div 
                                        style={{ 
                                            width: '100%', border: '2px dashed #e2e8f0', borderRadius: 24, 
                                            padding: '60px 20px', cursor: 'pointer', transition: 'all 0.2s ease',
                                            background: 'white'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
                                        onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                        onClick={() => inputRef.current?.click()}
                                    >
                                        <div style={{ width: 80, height: 80, background: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                                            <Upload size={32} color="#4f46e5" />
                                        </div>
                                        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Upload de Folha de Pagamento</h3>
                                        <p style={{ color: '#64748b', marginBottom: 32, maxWidth: 450, margin: '0 auto 32px', lineHeight: 1.6 }}>
                                            Arraste sua folha (.xlsx, .pdf ou .csv) ou clique para navegar. <br/>
                                            Garantimos a segurança ponta-a-ponta dos seus dados de remuneração.
                                        </p>

                                        <input type="file" ref={inputRef} style={{ display: 'none' }} onChange={handleUpload} accept=".xlsx,.xls,.pdf,.csv" />
                                        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '16px 32px', fontSize: 16, fontWeight: 700, borderRadius: 16 }}>
                                            {isUploading ? <Loader2 className="animate-spin" /> : <><FileText size={22} /> Selecionar Arquivo</>}
                                        </button>
                                    </div>
                                    <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 24, color: '#94a3b8', fontSize: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} /> Criptografia AES-256</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Conformidade LGPD</div>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 56, height: 56, background: '#f0fdf4', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Layers color="#10b981" size={28} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b' }}>{fileName}</h3>
                                                <p style={{ fontSize: 14, color: '#64748b' }}>
                                                    {recordCount > 0 
                                                        ? `Snapshot detectado • ${recordCount} registros encontrados`
                                                        : `Arquivo pronto para extração inteligente.`}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setStep(1)} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, background: '#334155', border: 'none', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Alterar</button>
                                    </div>

                                    {errorMsg && (
                                        <div style={{ marginBottom: 24, padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: '#991b1b', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <AlertCircle size={18} /> {errorMsg}
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                                        <div style={{ background: 'white', padding: 24, borderRadius: 20 }}>
                                            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.05em' }}>Mapeamento AI</h4>
                                            <div style={{ display: 'grid', gap: 12 }}>
                                                {[
                                                    { label: 'Identificação', detected: true, key: 'Automático' },
                                                    { label: 'Colaborador', detected: true, key: 'Automático' },
                                                    { label: 'Cargo Atual', detected: true, key: 'Automático' },
                                                    { label: 'Salário Base', detected: true, key: 'Automático' }
                                                ].map(item => (
                                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>{item.label}</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <code style={{ fontSize: 12, background: '#334155', padding: '2px 6px', borderRadius: 4, color: '#4f46e5' }}>{item.key}</code>
                                                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <CheckCircle size={10} color="white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ background: 'white', padding: 24, borderRadius: 20 }}>
                                            <h4 style={{ fontSize: 13, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.05em' }}>Abordagem de Extração</h4>
                                            <div style={{ padding: 20, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                <Brain size={32} color="#4f46e5" style={{ margin: '0 auto 16px' }} />
                                                <p style={{ fontSize: 13, color: '#1e293b', fontWeight: 700, marginBottom: 8 }}>Motor "Zero-Touch" Ativo</p>
                                                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                                                    Não é necessário configurar colunas. Nossa IA estruturará seus dados automaticamente.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="btn btn-primary" style={{ width: '100%', padding: 20, fontSize: 18, fontWeight: 800, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }} onClick={startAnalysis}>
                                        Iniciar Inteligência Salarial <ArrowRight size={20} />
                                    </button>
                                </div>
                            )}

                            {step === 3 && (
                                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <div style={{ width: 140, height: 140, margin: '0 auto 32px', position: 'relative' }}>
                                        <Loader2 className="animate-spin" size={140} color="#4f46e5" strokeWidth={1.5} />
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <div style={{ fontWeight: 900, fontSize: 32, color: '#0f172a' }}>{Math.round(analyzeProgress)}%</div>
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 12 }}>
                                        {analyzeProgress < 40 ? 'Extraindo dados com IA...' : 'Mapeando remuneração...'}
                                    </h3>
                                    <p style={{ color: '#64748b', fontSize: 17 }}>Carolina está estruturando sua folha para análise de mercado.</p>
                                </div>
                            )}

                            {step === 4 && (
                                <div style={{ textAlign: 'center' }}>
                                    <motion.div 
                                        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                        style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'white', boxShadow: '0 20px 40px rgba(16,185,129,0.2)' }}
                                    >
                                        <CheckCircle size={56} />
                                    </motion.div>
                                    <h3 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 16 }}>Análise Concluída!</h3>
                                    <p style={{ color: '#64748b', fontSize: 18, marginBottom: 48, maxWidth: 500, margin: '0 auto 48px', lineHeight: 1.6 }}>
                                        Identificamos <strong>{recordCount} colaboradores</strong>. O diagnóstico preliminar está pronto para sua revisão.
                                    </p>
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
                        </div>

                        {/* Sidebar Informational */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <button
                                    onClick={downloadTemplate}
                                    style={{ width: '100%', marginBottom: 24, padding: '24px', borderRadius: 24, border: '1px solid #e2e8f0', background: 'white', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ width: 48, height: 48, background: '#334155', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <Download size={24} color="#4f46e5" />
                                    </div>
                                    <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>Planilha Modelo</h4>
                                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Use nosso formato padrão para mapear seu RH em segundos.</p>
                                </button>

                                <div className="card" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', padding: 32, borderRadius: 24, color: 'white', border: 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                                        <Zap size={20} color="#fbbf24" fill="#fbbf24" />
                                        <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Engine</span>
                                    </div>
                                    <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
                                        Nossa inteligência detecta automaticamente as colunas, mesmo que os nomes variem:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {['ID / Código', 'Nome Completo', 'Cargo / Role', 'Salário Bruto'].map(tag => (
                                            <span key={tag} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#64748b' }}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

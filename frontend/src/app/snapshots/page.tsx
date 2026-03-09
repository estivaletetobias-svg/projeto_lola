'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link'; // Added Link import for step 4

export default function SnapshotsPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Success, 4: Finished
    const [fileName, setFileName] = useState('');
    const [fileData, setFileData] = useState<any[]>([]);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            setFileData(data);
            setIsUploading(false);
            setStep(2);
        };
        reader.readAsBinaryString(file);
    };

    const [analyzeProgress, setAnalyzeProgress] = useState(0);

    const startAnalysis = async () => {
        setStep(3);
        setAnalyzeProgress(10);

        try {
            const response = await fetch('http://localhost:3000/payroll/upload-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName,
                    periodDate: new Date().toISOString(),
                    data: fileData
                })
            });

            if (response.ok) {
                setAnalyzeProgress(100);
                setTimeout(() => setStep(4), 1000);
            } else {
                const errData = await response.json().catch(() => ({}));
                alert(`Erro no Servidor: ${errData.message || 'Erro desconhecido'}`);
                setStep(1);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Falha na comunicação com o servidor. Verifique se o backend está rodando em http://localhost:3000');
            setStep(1);
        }
    };

    return (
        <div style={{ maxWidth: 1000 }}> {/* Changed maxWidth */}
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Folha de Pagamento</h1>
                <p style={{ color: '#64748b' }}>Envie o snapshot mensal da folha para análise de inteligência salarial.</p>
            </div>

            <div className="card">
                {step === 1 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Upload size={32} color="#4f46e5" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Faça o upload da sua folha</h3>
                        <p style={{ color: '#64748b', marginBottom: 24 }}>Arraste o arquivo CSV ou XLSX aqui, ou clique para selecionar.</p>

                        <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleUpload} />
                        <label htmlFor="file-upload" className="btn btn-primary" style={{ display: 'inline-block', cursor: 'pointer' }}> {/* Added cursor style */}
                            {isUploading ? <Loader2 className="animate-spin" /> : 'Selecionar Arquivo'}
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 32, height: 32, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {/* New wrapper for CheckCircle */}
                                <CheckCircle color="#10b981" size={18} /> {/* Changed CheckCircle size */}
                            </div>
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Arquivo recebido: {fileName}</h3>
                        </div>

                        <p style={{ color: '#64748b', marginBottom: 20 }}>Mapeamos as colunas automaticamente. Por favor, revise:</p>

                        <div style={{ display: 'grid', gap: 12 }}>
                            {['Matrícula', 'Nome Completo', 'Área/Unidade', 'Salário Base', 'Benefícios'].map(col => (
                                <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                    <span style={{ fontWeight: 500 }}>{col}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 12 }}> {/* New mapped column display */}
                                        <CheckCircle size={14} /> Coluna Mapeada
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 32 }} onClick={startAnalysis}> {/* Changed onClick to startAnalysis */}
                            Confirmar e Iniciar Análise
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: 100, height: 100, margin: '0 auto 24px', position: 'relative' }}> {/* New wrapper for Loader2 and progress */}
                            <Loader2 className="animate-spin" size={100} color="#4f46e5" /> {/* Changed Loader2 size */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 700, color: '#4f46e5' }}>{analyzeProgress}%</div> {/* Progress percentage */}
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{analyzeProgress < 30 ? 'Lendo dados...' : (analyzeProgress < 70 ? 'Calculando Gaps de Mercado...' : 'Validando Job Match...')}</h3> {/* Dynamic text */}
                        <p style={{ color: '#64748b' }}>Estamos consolidando as informações em tempo real.</p> {/* Updated description */}
                    </div>
                )}

                {step === 4 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <div style={{ width: 64, height: 64, background: '#f0fdf4', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <CheckCircle size={40} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Análise Concluída!</h3>
                        <p style={{ color: '#64748b', marginBottom: 32 }}>O snapshot de <strong>Março/2026</strong> já está disponível no Dashboard.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <Link href="/" className="btn btn-primary">Ver Dashboard</Link>
                            <Link href="/diagnostics" className="btn" style={{ background: '#f1f5f9' }}>Abrir Diagnóstico</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

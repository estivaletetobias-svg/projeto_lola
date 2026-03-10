'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

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
            const host = window.location.hostname;
            const response = await fetch(`http://${host}:3000/payroll/upload-local`, {
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
            const host = window.location.hostname;
            alert(`Falha na comunicação com o servidor. Verifique se o backend está rodando em http://${host}:3000`);
            setStep(1);
        }
    };

    const downloadTemplate = () => {
        const data = [
            { id: 1, nome: "Joao Silva", cargo: "Engenheiro Civil", salario: 8500.00 },
            { id: 2, nome: "Maria Sousa", cargo: "Arquiteta Junior", salario: 5200.00 },
            { id: 3, nome: "Jose Santos", cargo: "Mestre de Obras", salario: 4800.00 }
        ];

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll");
        XLSX.writeFile(wb, "modelo_lola_payroll.xlsx");
    };

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Folha de Pagamento</h1>
                    <p style={{ color: '#64748b' }}>Envie o snapshot mensal da folha para análise de inteligência salarial.</p>
                </div>
                <button
                    onClick={downloadTemplate}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                    <Download size={16} /> Baixar Planilha Modelo
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: step === 1 ? '1fr 300px' : '1fr', gap: 24 }}>
                <div className="card" style={{ padding: 32 }}>
                    {step === 1 && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 64, height: 64, background: '#eef2ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Upload size={32} color="#4f46e5" />
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Faça o upload da sua folha</h3>
                            <p style={{ color: '#64748b', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                                Arraste o arquivo CSV ou XLSX aqui. Recomendamos usar nosso modelo para garantir 100% de precisão nos gráficos.
                            </p>

                            <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleUpload} />
                            <label htmlFor="file-upload" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '12px 24px', fontSize: 16 }}>
                                {isUploading ? <Loader2 className="animate-spin" /> : <><FileText size={20} /> Selecionar Arquivo</>}
                            </label>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle color="#10b981" size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{fileName}</h3>
                                        <p style={{ fontSize: 13, color: '#64748b' }}>{fileData.length} linhas identificadas</p>
                                    </div>
                                </div>
                                <button onClick={() => setStep(1)} style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Trocar arquivo</button>
                            </div>

                            <div style={{ marginBottom: 32 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Prévia dos Dados</h4>
                                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead style={{ background: '#f8fafc' }}>
                                            <tr>
                                                {fileData.length > 0 && Object.keys(fileData[0]).slice(0, 5).map(key => (
                                                    <th key={key} style={{ padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fileData.slice(0, 3).map((row, i) => (
                                                <tr key={i} style={{ borderBottom: i === 2 ? 'none' : '1px solid #f1f5f9' }}>
                                                    {Object.values(row).slice(0, 5).map((val: any, j) => (
                                                        <td key={j} style={{ padding: '10px 12px' }}>{String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, marginBottom: 32 }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Mapeamento de Inteligência</h4>
                                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Detectamos as seguintes informações essenciais:</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {[
                                        { label: 'Identificação', detected: !!(fileData[0].id || fileData[0].matricula || fileData[0].codigo) },
                                        { label: 'Nome do Colaborador', detected: !!(fileData[0].nome || fileData[0].name) },
                                        { label: 'Cargo / Função', detected: !!(fileData[0].cargo || fileData[0].funcao || fileData[0].title) },
                                        { label: 'Remuneração Base', detected: !!(fileData[0].salario || fileData[0].remuneracao) }
                                    ].map(item => (
                                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: item.detected ? '#0f172a' : '#94a3b8' }}>
                                            {item.detected ? <CheckCircle size={16} color="#10b981" /> : <AlertCircle size={16} color="#cbd5e1" />}
                                            {item.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, fontWeight: 700 }} onClick={startAnalysis}>
                                Confirmar e Analisar {fileData.length} Colaboradores
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: 120, height: 120, margin: '0 auto 32px', position: 'relative' }}>
                                <Loader2 className="animate-spin" size={120} color="#4f46e5" strokeWidth={1.5} />
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: 24, color: '#4f46e5' }}>{analyzeProgress}%</div>
                            </div>
                            <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
                                {analyzeProgress < 30 ? 'Extraindo dados...' : (analyzeProgress < 70 ? 'Calculando Estatísticas...' : 'Finalizando Diagnóstico...')}
                            </h3>
                            <p style={{ color: '#64748b', fontSize: 16 }}>Integrando com o motor de inteligência Carolina.</p>
                        </div>
                    )}

                    {step === 4 && (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: 80, height: 80, background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle size={48} color="#10b981" />
                            </div>
                            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Pronto para Diagnose!</h3>
                            <p style={{ color: '#64748b', fontSize: 17, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
                                O snapshot foi processado com sucesso. Agora você deve garantir que os cargos estejam mapeados corretamente.
                            </p>
                            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                                <Link href="/job-match" className="btn btn-primary" style={{ padding: '14px 28px' }}>Ir para Mapeamento</Link>
                                <Link href="/diagnostics" className="btn" style={{ background: '#f1f5f9', padding: '14px 28px' }}>Pular p/ Diagnóstico</Link>
                            </div>
                        </div>
                    )}
                </div>

                {step === 1 && (
                    <div className="card" style={{ background: '#1e293b', padding: 24, color: 'white', border: 'none' }}>
                        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Zap size={18} color="#fbbf24" fill="#fbbf24" /> Dica de Ouro
                        </h4>
                        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
                            Para que os gráficos funcionem perfeitamente, garanta que sua planilha tenha estas colunas:
                        </p>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {['id', 'nome', 'cargo', 'salario'].map(col => (
                                <li key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                    <code style={{ background: '#334155', padding: '2px 6px', borderRadius: 4, color: '#e2e8f0' }}>{col}</code>
                                    <span style={{ color: '#94a3b8' }}>{col === 'salario' ? 'Usar ponto (ex: 5500.00)' : 'Obrigatório'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

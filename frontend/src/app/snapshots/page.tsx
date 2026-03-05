'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SnapshotsPage() {
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Success

    const handleUpload = () => {
        setIsUploading(true);
        setTimeout(() => {
            setIsUploading(false);
            setStep(2);
        }, 2000);
    };

    return (
        <div style={{ maxWidth: 800 }}>
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
                        <label htmlFor="file-upload" className="btn btn-primary" style={{ display: 'inline-block' }}>
                            {isUploading ? <Loader2 className="animate-spin" /> : 'Selecionar Arquivo'}
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <CheckCircle color="#10b981" />
                            <h3 style={{ fontSize: 18, fontWeight: 600 }}>Arquivo recebido: folha_março_2026.xlsx</h3>
                        </div>

                        <p style={{ color: '#64748b', marginBottom: 20 }}>Mapeamos as colunas automaticamente. Por favor, revise:</p>

                        <div style={{ display: 'grid', gap: 12 }}>
                            {['Matrícula', 'Nome Completo', 'Área/Unidade', 'Salário Base', 'Benefícios'].map(col => (
                                <div key={col} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                                    <span style={{ fontWeight: 500 }}>{col}</span>
                                    <select style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                        <option>Coluna da Planilha: {col}</option>
                                    </select>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%', marginTop: 32 }} onClick={() => setStep(3)}>
                            Confirmar e Iniciar Análise
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Loader2 className="animate-spin" size={48} color="#4f46e5" style={{ margin: '0 auto 20px' }} />
                        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Analisando sua folha...</h3>
                        <p style={{ color: '#64748b' }}>Isso pode levar alguns segundos. Estamos validando dados e realizando o Job Match.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { Save, Info } from 'lucide-react';

export default function OnboardingPage() {
    const [formData, setFormData] = useState({
        name: 'Lola Tech Ltd',
        cnpj: '12.345.678/0001-99',
        sector: 'Tecnologia',
        size: '51-200',
        city: 'São Paulo',
        state: 'SP',
    });

    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Configuração da Empresa</h1>
                <p style={{ color: '#64748b' }}>Complete os dados da sua organização para segmentação precisa de mercado.</p>
            </div>

            <div className="card" style={{ display: 'grid', gap: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Razão Social / Nome Fantasia</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>CNPJ</label>
                        <input
                            type="text"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Setor (CNAE)</label>
                        <select
                            value={formData.sector}
                            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        >
                            <option>Tecnologia / Software</option>
                            <option>Financeiro / Bancos</option>
                            <option>Indústria / Manufatura</option>
                            <option>Serviços Médicos</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Porte da Empresa</label>
                        <select
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        >
                            <option>0-50 colaboradores</option>
                            <option>51-200 colaboradores</option>
                            <option>201-500 colaboradores</option>
                            <option>500+ colaboradores</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Cidade</label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Estado (UF)</label>
                        <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: 24, padding: 16, background: '#334155', borderRadius: 12, display: 'flex', gap: 16 }}>
                    <Info color="#4f46e5" size={24} />
                    <p style={{ fontSize: 13, color: '#475569' }}>
                        Essas informações são cruciais para o algoritmo de Benchmark. Garantimos a anonimidade dos seus dados individuais conforme a LGPD.
                    </p>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <Save size={18} /> Salvar e Continuar
                </button>
            </div>
        </div>
    );
}

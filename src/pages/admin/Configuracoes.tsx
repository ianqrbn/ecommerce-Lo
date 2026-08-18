import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2 } from 'lucide-react';

export default function Configuracoes() {
  const [cepOrigem, setCepOrigem] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'cep_origem')
        .single();

      if (error) throw error;
      if (data) setCepOrigem(data.valor);
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const cleanCep = cepOrigem.replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos.');
      }

      const { error } = await supabase
        .from('configuracoes')
        .upsert({ chave: 'cep_origem', valor: cleanCep });

      if (error) throw error;
      setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setMessage({ text: err.message || 'Erro ao salvar configurações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vinho-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações Gerais</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Frete e Envio</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CEP de Origem (Remetente)
          </label>
          <input
            type="text"
            value={cepOrigem}
            onChange={(e) => setCepOrigem(e.target.value)}
            placeholder="Apenas números"
            className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vinho-500 focus:border-vinho-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Este CEP será usado pela API do Melhor Envio para calcular o frete dos clientes.
          </p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-vinho-600 text-white px-4 py-2 rounded-md hover:bg-vinho-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2 } from 'lucide-react';

interface CupomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  cupom?: any;
}

export function CupomFormModal({ isOpen, onClose, onSave, cupom }: CupomFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    tipo: 'porcentagem',
    valor: '',
    ativo: true,
    quantidade_maxima: '',
    limite_por_cliente: '',
  });

  useEffect(() => {
    if (cupom) {
      setFormData({
        codigo: cupom.codigo,
        tipo: cupom.tipo,
        valor: cupom.valor.toString(),
        ativo: cupom.ativo,
        quantidade_maxima: cupom.quantidade_maxima ? cupom.quantidade_maxima.toString() : '',
        limite_por_cliente: cupom.limite_por_cliente ? cupom.limite_por_cliente.toString() : '',
      });
    } else {
      setFormData({
        codigo: '',
        tipo: 'porcentagem',
        valor: '',
        ativo: true,
        quantidade_maxima: '',
        limite_por_cliente: '',
      });
    }
  }, [cupom, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        codigo: formData.codigo.toUpperCase().trim(),
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        ativo: formData.ativo,
        quantidade_maxima: formData.quantidade_maxima ? parseInt(formData.quantidade_maxima) : null,
        limite_por_cliente: formData.limite_por_cliente ? parseInt(formData.limite_por_cliente) : null,
      };

      if (cupom) {
        const { error } = await supabase.from('cupons').update(dataToSave).eq('id', cupom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cupons').insert([dataToSave]);
        if (error) throw error;
      }

      onSave();
    } catch (err: any) {
      console.error('Erro ao salvar cupom:', err);
      alert('Erro ao salvar cupom: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{cupom ? 'Editar Cupom' : 'Novo Cupom'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código do Cupom</label>
            <input
              type="text"
              required
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              placeholder="Ex: BEMVINDO10"
              className="w-full px-3 py-2 border rounded-md uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Desconto</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="porcentagem">Porcentagem (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder={formData.tipo === 'porcentagem' ? '10' : '50.00'}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite Geral (Qtd)</label>
              <input
                type="number"
                min="1"
                value={formData.quantidade_maxima}
                onChange={(e) => setFormData({ ...formData, quantidade_maxima: e.target.value })}
                placeholder="Ex: 100 (Opcional)"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite por Cliente</label>
              <input
                type="number"
                min="1"
                value={formData.limite_por_cliente}
                onChange={(e) => setFormData({ ...formData, limite_por_cliente: e.target.value })}
                placeholder="Ex: 1 (Opcional)"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="rounded text-vinho-600 focus:ring-vinho-500"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Cupom Ativo</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-vinho-600 text-white rounded-md hover:bg-vinho-700 disabled:opacity-50 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Loader2, Ticket, CheckCircle, XCircle } from 'lucide-react';
import { CupomFormModal } from '../../components/admin/CupomFormModal';

export default function CuponsAdmin() {
  const [cupons, setCupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cupomEditando, setCupomEditando] = useState<any>(null);

  useEffect(() => {
    fetchCupons();
  }, []);

  const fetchCupons = async () => {
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCupons(data || []);
    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, codigo: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cupom "${codigo}"?\nSe ele já foi usado em pedidos, é recomendado apenas Desativá-lo.`)) {
      try {
        const { error } = await supabase.from('cupons').delete().eq('id', id);
        if (error) throw error;
        setCupons(cupons.filter((c) => c.id !== id));
      } catch (err: any) {
        console.error('Erro ao excluir cupom:', err);
        alert('Erro ao excluir cupom. Talvez ele já esteja vinculado a algum pedido. Tente desativá-lo em vez de excluir.');
      }
    }
  };

  const handleToggleAtivo = async (id: string, ativoAtual: boolean) => {
    try {
      const { error } = await supabase.from('cupons').update({ ativo: !ativoAtual }).eq('id', id);
      if (error) throw error;
      fetchCupons();
    } catch (err) {
      console.error('Erro ao alternar status do cupom:', err);
      alert('Erro ao alterar status.');
    }
  };

  const handleNovoCupom = () => {
    setCupomEditando(null);
    setIsModalOpen(true);
  };

  const handleEditarCupom = (cupom: any) => {
    setCupomEditando(cupom);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vinho-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cupons</h1>
        <button onClick={handleNovoCupom} className="bg-vinho-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-vinho-700 transition-colors">
          <Plus className="w-4 h-4" />
          Novo Cupom
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-600">
              <th className="p-4 font-medium">Código</th>
              <th className="p-4 font-medium">Desconto</th>
              <th className="p-4 font-medium">Limites / Usos</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Nenhum cupom cadastrado.
                </td>
              </tr>
            ) : (
              cupons.map((cupom) => (
                <tr key={cupom.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-gray-900 tracking-wide">{cupom.codigo}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cupom.tipo === 'porcentagem' ? `${cupom.valor}% OFF` : `R$ ${Number(cupom.valor).toFixed(2)} OFF`}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-600">
                      <div>Usos: <strong>{cupom.usos_atuais}</strong> {cupom.quantidade_maxima ? `/ ${cupom.quantidade_maxima}` : '(Sem limite)'}</div>
                      {cupom.limite_por_cliente && <div className="text-xs text-gray-500 mt-1">Máx por cliente: {cupom.limite_por_cliente}</div>}
                    </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => handleToggleAtivo(cupom.id, cupom.ativo)}
                      className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded transition-colors ${cupom.ativo ? 'text-green-700 bg-green-50 hover:bg-green-100' : 'text-red-700 bg-red-50 hover:bg-red-100'}`}
                    >
                      {cupom.ativo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {cupom.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEditarCupom(cupom)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cupom.id, cupom.codigo)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CupomFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
          fetchCupons();
        }}
        cupom={cupomEditando}
      />
    </div>
  );
}

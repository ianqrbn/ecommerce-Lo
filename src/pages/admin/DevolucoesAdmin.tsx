import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, RefreshCw, AlertTriangle, CheckCircle, RotateCcw, XCircle } from 'lucide-react';

export default function DevolucoesAdmin() {
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDevolucoes();
  }, []);

  const fetchDevolucoes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('devolucoes')
      .select(`
        *,
        pedidos (
          id, total, data_pedido, 
          enderecos (usuarios (nome, email))
        )
      `)
      .order('data_solicitacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar devoluções:', error);
    } else if (data) {
      setDevolucoes(data);
    }
    setLoading(false);
  };

  const handleAprovarGerarEtiqueta = async (devolucaoId: string) => {
    if (!window.confirm('Isto irá gerar a etiqueta de devolução e descontar o valor do frete do seu saldo no Melhor Envio. Confirmar?')) return;
    
    setProcessingId(devolucaoId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-return-label', {
        body: { devolucao_id: devolucaoId }
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      
      if (data && data.message) {
        alert(data.message);
      } else {
        alert('Etiqueta gerada com sucesso!');
      }
      
      fetchDevolucoes();
    } catch (err: any) {
      console.error(err);
      alert('Falha ao tentar gerar etiqueta: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLiberarCredito = async (devolucao: any) => {
    if (!window.confirm(`Você tem certeza que recebeu o produto e deseja liberar R$ ${devolucao.pedidos.total.toFixed(2)} de crédito para o cliente?`)) return;

    setProcessingId(devolucao.id);
    try {
      const valorCredito = devolucao.pedidos.total;
      const usuarioId = devolucao.usuario_id;
      
      // 1. Atualizar status
      const { error: devError } = await supabase
        .from('devolucoes')
        .update({ status: 'credito_liberado', valor_credito: valorCredito })
        .eq('id', devolucao.id);
      if (devError) throw devError;

      // 2. Inserir transacao
      const { error: trxError } = await supabase
        .from('transacoes_credito')
        .insert([{
          usuario_id: usuarioId,
          pedido_id: devolucao.pedido_id,
          valor: valorCredito,
          tipo: 'entrada',
          descricao: `Crédito por devolução do pedido #${devolucao.pedido_id}`
        }]);
      if (trxError) throw trxError;

      // 3. Buscar e somar
      const { data: userData, error: userGetError } = await supabase
        .from('usuarios')
        .select('credito_loja')
        .eq('id', usuarioId)
        .single();
      if (userGetError) throw userGetError;

      const novoSaldo = Number(userData.credito_loja || 0) + Number(valorCredito);

      const { error: userUpdateError } = await supabase
        .from('usuarios')
        .update({ credito_loja: novoSaldo })
        .eq('id', usuarioId);
      if (userUpdateError) throw userUpdateError;

      alert('Crédito liberado com sucesso!');
      fetchDevolucoes();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao liberar crédito: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecusar = async (devolucaoId: string) => {
    if (!window.confirm('Tem certeza que deseja recusar essa devolução? O cliente não poderá solicitar novamente.')) return;
    
    setProcessingId(devolucaoId);
    try {
      const { error } = await supabase
        .from('devolucoes')
        .update({ status: 'recusada' })
        .eq('id', devolucaoId);

      if (error) throw error;
      fetchDevolucoes();
    } catch (err: any) {
      alert('Erro ao recusar: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  }

  const renderStatus = (devolucao: any) => {
    if (devolucao.status === 'pendente') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pendente</span>;
    }
    if (devolucao.status === 'etiqueta_gerada' || devolucao.status === 'gerando') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Aguardando Envio</span>;
    }
    if (devolucao.status === 'recebido_loja') {
      return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">Recebido</span>;
    }
    if (devolucao.status === 'credito_liberado') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Crédito Liberado</span>;
    }
    if (devolucao.status === 'recusada') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Recusada</span>;
    }
    return <span className="text-gray-500">{devolucao.status}</span>;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando devoluções...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-vinho-700" />
          Devoluções
        </h1>
        <button 
          onClick={fetchDevolucoes}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-vinho-700"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Pedido & Data</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Motivo</th>
                <th className="px-6 py-4 font-medium">Valor Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devolucoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma devolução encontrada.
                  </td>
                </tr>
              ) : (
                devolucoes.map((dev) => (
                  <tr key={dev.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">#{dev.pedido_id}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(dev.data_solicitacao).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{dev.pedidos?.enderecos?.usuarios?.nome || 'Usuário Deletado'}</div>
                      <div className="text-xs text-gray-500">{dev.pedidos?.enderecos?.usuarios?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 line-clamp-2 max-w-[200px]" title={dev.motivo}>{dev.motivo}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {Number(dev.pedidos?.total || 0).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatus(dev)}
                    </td>
                    <td className="px-6 py-4 text-right flex flex-col items-end gap-2">
                      {dev.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleAprovarGerarEtiqueta(dev.id)}
                            disabled={processingId === dev.id}
                            className="flex items-center gap-1 px-3 py-1 bg-vinho-700 text-white text-xs rounded hover:bg-vinho-800 disabled:opacity-50"
                          >
                            <Package className="w-3 h-3" /> Gerar Etiqueta
                          </button>
                          <button
                            onClick={() => handleRecusar(dev.id)}
                            disabled={processingId === dev.id}
                            className="flex items-center gap-1 px-3 py-1 bg-white border border-red-200 text-red-700 text-xs rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" /> Recusar
                          </button>
                        </>
                      )}

                      {dev.status === 'etiqueta_gerada' && (
                        <>
                          {dev.etiqueta_url && (
                            <a href={dev.etiqueta_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                              Ver Etiqueta ({dev.rastreio})
                            </a>
                          )}
                          <button
                            onClick={() => handleLiberarCredito(dev)}
                            disabled={processingId === dev.id}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50 mt-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Liberar Crédito
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

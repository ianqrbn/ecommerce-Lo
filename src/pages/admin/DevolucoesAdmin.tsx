import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, RefreshCw, AlertTriangle, CheckCircle, RotateCcw, XCircle, Mail, Box, ShieldAlert } from 'lucide-react';

export default function DevolucoesAdmin() {
  const [devolucoes, setDevolucoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal de Recusa
  const [recusaModalOpen, setRecusaModalOpen] = useState(false);
  const [recusaDevolucaoId, setRecusaDevolucaoId] = useState<string | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [submittingRecusa, setSubmittingRecusa] = useState(false);

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
    if (!window.confirm('Isto irá gerar a etiqueta de devolução no Melhor Envio e disparar o e-mail com as instruções para o cliente. O crédito NÃO será liberado até você confirmar o recebimento das peças na loja. Confirmar?')) return;
    
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
        alert('Etiqueta gerada com sucesso! O cliente receberá o e-mail com a etiqueta e as instruções.');
      }
      
      fetchDevolucoes();
    } catch (err: any) {
      console.error(err);
      alert('Falha ao tentar gerar etiqueta: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmarRecebimento = async (devolucaoId: string) => {
    if (!window.confirm('Confirmar que o pacote com os produtos foi recebido fisicamente na loja para conferência?')) return;

    setProcessingId(devolucaoId);
    try {
      const { error } = await supabase
        .from('devolucoes')
        .update({ status: 'recebido_loja' })
        .eq('id', devolucaoId);

      if (error) throw error;
      alert('Status atualizado: Produto Recebido na Loja. Agora você pode inspecionar as peças e liberar o crédito.');
      fetchDevolucoes();
    } catch (err: any) {
      alert('Erro ao registrar recebimento: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLiberarCredito = async (devolucao: any) => {
    if (!window.confirm(`Você confirma que conferiu os produtos em mãos e deseja liberar R$ ${Number(devolucao.pedidos?.total || 0).toFixed(2)} de crédito para o cliente?`)) return;

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

      alert('Crédito liberado com sucesso na carteira do cliente!');
      fetchDevolucoes();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao liberar crédito: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const openRecusaModal = (devolucaoId: string) => {
    setRecusaDevolucaoId(devolucaoId);
    setMotivoRecusa('');
    setRecusaModalOpen(true);
  };

  const handleConfirmarRecusa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recusaDevolucaoId) return;
    if (!motivoRecusa.trim()) {
      alert('Por favor, informe o motivo da recusa.');
      return;
    }

    setSubmittingRecusa(true);
    try {
      const { error } = await supabase
        .from('devolucoes')
        .update({ 
          status: 'recusada',
          motivo_recusa: motivoRecusa.trim()
        })
        .eq('id', recusaDevolucaoId);

      if (error) throw error;

      alert('Devolução recusada com sucesso. O cliente poderá visualizar a justificativa informada.');
      setRecusaModalOpen(false);
      fetchDevolucoes();
    } catch (err: any) {
      alert('Erro ao recusar devolução: ' + err.message);
    } finally {
      setSubmittingRecusa(false);
    }
  };

  const handleReenviarEmail = async (devolucao: any) => {
    setProcessingId(devolucao.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-return-email', {
        body: { devolucao_id: devolucao.id }
      });
      if (error) throw error;
      if (data && data.message) {
        alert(data.message);
      } else {
        alert('E-mail com orientações e etiqueta enviado com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const renderStatus = (devolucao: any) => {
    if (devolucao.status === 'pendente') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Pendente
        </span>
      );
    }
    if (devolucao.status === 'etiqueta_gerada' || devolucao.status === 'gerando') {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Aguardando Envio
          </span>
          <span className="text-[11px] text-gray-500">Etiqueta gerada</span>
        </div>
      );
    }
    if (devolucao.status === 'recebido_loja') {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Recebido na Loja
          </span>
          <span className="text-[11px] text-purple-600 font-medium">Aguardando conferência</span>
        </div>
      );
    }
    if (devolucao.status === 'credito_liberado') {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Crédito Liberado
          </span>
          {devolucao.valor_credito && (
            <span className="text-[11px] text-green-700 font-medium">
              R$ {Number(devolucao.valor_credito).toFixed(2).replace('.', ',')}
            </span>
          )}
        </div>
      );
    }
    if (devolucao.status === 'recusada') {
      return (
        <div className="flex flex-col gap-1 max-w-[200px]">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Recusada
          </span>
          {devolucao.motivo_recusa && (
            <p className="text-[11px] text-red-600 line-clamp-2" title={devolucao.motivo_recusa}>
              Motivo: {devolucao.motivo_recusa}
            </p>
          )}
        </div>
      );
    }
    return <span className="text-gray-500">{devolucao.status}</span>;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando devoluções...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-vinho-700" />
            Devoluções e Trocas
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie o pipeline: aprovação da etiqueta, recebimento do produto físico e liberação de crédito.
          </p>
        </div>
        <button 
          onClick={fetchDevolucoes}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-vinho-700 bg-white border border-gray-200 px-3 py-1.5 rounded-md shadow-sm"
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
                <th className="px-6 py-4 font-medium">Motivo do Cliente</th>
                <th className="px-6 py-4 font-medium">Valor Total</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações do Pipeline</th>
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
                      <p className="font-medium text-gray-900">#{dev.pedido_id}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(dev.data_solicitacao).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{dev.pedidos?.enderecos?.usuarios?.nome || 'Usuário'}</div>
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        {/* 1. Status PENDENTE: Pode gerar etiqueta ou recusar com motivo */}
                        {dev.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => handleAprovarGerarEtiqueta(dev.id)}
                              disabled={processingId === dev.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-vinho-700 text-white text-xs font-medium rounded hover:bg-vinho-800 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <Package className="w-3.5 h-3.5" /> Gerar Etiqueta & Notificar
                            </button>
                            <button
                              onClick={() => openRecusaModal(dev.id)}
                              disabled={processingId === dev.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-medium rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Recusar Solicitação
                            </button>
                          </>
                        )}

                        {/* 2. Status ETIQUETA_GERADA: Etiqueta está com o cliente. Espera chegar na loja */}
                        {dev.status === 'etiqueta_gerada' && (
                          <>
                            <button
                              onClick={() => handleConfirmarRecebimento(dev.id)}
                              disabled={processingId === dev.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 text-white text-xs font-medium rounded hover:bg-purple-800 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <Box className="w-3.5 h-3.5" /> Confirmar Chegada na Loja
                            </button>
                            
                            <div className="flex items-center gap-2 mt-1">
                              {dev.etiqueta_url && (
                                <a 
                                  href={dev.etiqueta_url} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  Ver Etiqueta ({dev.rastreio})
                                </a>
                              )}
                              <button
                                onClick={() => handleReenviarEmail(dev)}
                                disabled={processingId === dev.id}
                                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 border-l border-gray-200 pl-2"
                                title="Reenviar e-mail de orientações"
                              >
                                <Mail className="w-3 h-3" /> Reenviar
                              </button>
                            </div>
                          </>
                        )}

                        {/* 3. Status RECEBIDO_LOJA: O lojista conferiu as peças e agora decide liberar o crédito ou recusar por avaria */}
                        {dev.status === 'recebido_loja' && (
                          <>
                            <button
                              onClick={() => handleLiberarCredito(dev)}
                              disabled={processingId === dev.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Inspecionado: Liberar Crédito
                            </button>
                            <button
                              onClick={() => openRecusaModal(dev.id)}
                              disabled={processingId === dev.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-red-600 hover:text-red-800 text-xs font-medium hover:underline"
                            >
                              <ShieldAlert className="w-3 h-3" /> Recusar por avaria
                            </button>
                          </>
                        )}

                        {/* 4. Status CREDITO_LIBERADO: Finalizado */}
                        {dev.status === 'credito_liberado' && (
                          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Devolução Concluída
                          </span>
                        )}

                        {/* 5. Status RECUSADA: Finalizado com recusa */}
                        {dev.status === 'recusada' && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Processo Encerrado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Justificativa de Recusa */}
      {recusaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-2 text-red-700 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900">Recusar Solicitação de Devolução</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Informe o motivo da recusa. Esta justificativa será apresentada de forma clara para o cliente na área de pedidos.
            </p>

            <form onSubmit={handleConfirmarRecusa}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Motivo da Recusa *
                </label>
                <textarea
                  required
                  rows={4}
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  placeholder="Ex: Produto fora do prazo de 7 dias após o recebimento, ou marcas evidentes de uso/avaria na joia."
                  className="w-full text-sm border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-vinho-500 focus:border-vinho-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecusaModalOpen(false)}
                  disabled={submittingRecusa}
                  className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingRecusa || !motivoRecusa.trim()}
                  className="px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submittingRecusa ? 'Processando...' : 'Confirmar Recusa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

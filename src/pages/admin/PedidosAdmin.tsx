import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, RefreshCw, Printer, AlertTriangle, Plus, Store, CheckCircle2, Mail, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [emailSendingId, setEmailSendingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        enderecos (
          rua,
          cidade,
          estado,
          usuarios (nome, email)
        )
      `)
      .in('status', ['pago', 'enviado', 'entregue'])
      .order('data_pedido', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
    } else if (data) {
      setPedidos(data);
    }
    setLoading(false);
  };

  const handleImprimir = async (melhor_envio_id: string, pedidoId: number) => {
    setProcessingId(pedidoId);
    try {
      const { data: funcData, error } = await supabase.functions.invoke('print-shipping-label', {
        body: { order_id_me: melhor_envio_id }
      });

      if (error) throw error;

      if (funcData && funcData.url) {
        window.open(funcData.url, '_blank');
        fetchPedidos();
      } else {
        const urlArray = Object.values(funcData);
        if (urlArray.length > 0 && typeof urlArray[0] === 'string' && urlArray[0].startsWith('http')) {
           window.open(urlArray[0] as string, '_blank');
           fetchPedidos();
        } else {
           alert('Não foi possível obter a URL do PDF.');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro ao tentar imprimir etiqueta: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTentarGerar = async (pedidoId: number) => {
    setProcessingId(pedidoId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-shipping-label', {
        body: { pedido_id: pedidoId }
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      
      if (data && data.message) {
        alert(data.message);
      } else {
        alert('Etiqueta gerada com sucesso!');
      }
      
      fetchPedidos();
    } catch (err: any) {
      console.error(err);
      alert('Falha ao tentar gerar etiqueta: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Marcar como entregue e disparar e-mail de pós-venda (agradecimento + cuidados com a joia)
  const handleMarcarEntregue = async (pedidoId: number) => {
    if (!window.confirm(`Deseja marcar o pedido #${pedidoId} como ENTREGUE?\nO cliente receberá um e-mail especial de agradecimento com dicas de cuidados com a joia.`)) {
      return;
    }

    setProcessingId(pedidoId);
    try {
      // 1. Atualiza status no banco
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ status: 'entregue' })
        .eq('id', pedidoId);

      if (updateError) throw updateError;

      // 2. Dispara e-mail de entrega & agradecimento
      const { error: emailError } = await supabase.functions.invoke('send-order-email', {
        body: { pedido_id: pedidoId, tipo: 'pedido_entregue' }
      });

      if (emailError) {
        console.warn('Aviso: Pedido atualizado, mas falhou ao enviar e-mail:', emailError);
        alert('Pedido marcado como Entregue! (Houve uma ressalva no envio do e-mail)');
      } else {
        alert(`Pedido #${pedidoId} marcado como Entregue!\nE-mail de agradecimento e cuidados enviado ao cliente.`);
      }

      fetchPedidos();
    } catch (err: any) {
      console.error('Erro ao marcar pedido como entregue:', err);
      alert('Erro ao atualizar status: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Disparar e-mail manualmente (Reenvio)
  const handleDispararEmailManual = async (pedidoId: number, tipo: 'pagamento_confirmado' | 'pedido_entregue') => {
    const nomeAcao = tipo === 'pagamento_confirmado' ? 'Confirmação de Pagamento' : 'Agradecimento & Entrega';
    if (!window.confirm(`Deseja reenviar o e-mail de "${nomeAcao}" para o cliente do pedido #${pedidoId}?`)) {
      return;
    }

    setEmailSendingId(pedidoId);
    try {
      const { error } = await supabase.functions.invoke('send-order-email', {
        body: { pedido_id: pedidoId, tipo }
      });

      if (error) throw error;
      alert(`E-mail de "${nomeAcao}" reenviado com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao reenviar e-mail:', err);
      alert('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setEmailSendingId(null);
    }
  };

  const renderEtiquetaStatus = (pedido: any) => {
    if (pedido.status === 'entregue') {
      return (
        <div className="flex flex-col items-end gap-1.5">
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregue
          </span>
          <button
            onClick={() => handleDispararEmailManual(pedido.id, 'pedido_entregue')}
            disabled={emailSendingId === pedido.id}
            className="text-[11px] text-gray-500 hover:text-vinho-700 underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Reenviar e-mail de agradecimento e cuidados"
          >
            <Mail className="w-3 h-3" />
            {emailSendingId === pedido.id ? 'Enviando...' : 'Reenviar E-mail'}
          </button>
        </div>
      );
    }

    if (pedido.melhor_envio_service_id === 0 || pedido.etiqueta_status === 'presencial') {
      return (
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1 bg-vinho-50 text-vinho-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-vinho-200">
            <Store className="w-3 h-3" />
            Venda Balcão / Presencial
          </span>
          <button
            onClick={() => handleMarcarEntregue(pedido.id)}
            disabled={processingId === pedido.id}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 text-white text-xs font-medium rounded hover:bg-emerald-800 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Marcar como entregue e disparar e-mail de agradecimento"
          >
            <CheckCircle2 className="w-3 h-3" />
            Marcar Entregue
          </button>
        </div>
      );
    }

    if (pedido.etiqueta_status === 'impressa') {
      return (
        <div className="flex flex-col items-end gap-2">
          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded border border-green-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Etiqueta Impressa
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleImprimir(pedido.melhor_envio_id, pedido.id)}
              disabled={processingId === pedido.id}
              className="flex items-center gap-1 px-2.5 py-1 bg-white text-gray-600 border border-gray-200 text-xs rounded hover:bg-gray-50 transition shadow-xs disabled:opacity-50"
            >
              {processingId === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
              Reimprimir
            </button>
            <button
              onClick={() => handleMarcarEntregue(pedido.id)}
              disabled={processingId === pedido.id}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-700 text-white text-xs font-medium rounded hover:bg-emerald-800 transition shadow-xs cursor-pointer disabled:opacity-50"
              title="Marcar como entregue e enviar e-mail de agradecimento"
            >
              <Check className="w-3 h-3" />
              Entregue
            </button>
          </div>
        </div>
      );
    }

    if (pedido.etiqueta_status === 'gerada') {
      return (
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={() => handleImprimir(pedido.melhor_envio_id, pedido.id)}
            disabled={processingId === pedido.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
          >
            {processingId === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
            Imprimir Etiqueta
          </button>
          <button
            onClick={() => handleMarcarEntregue(pedido.id)}
            disabled={processingId === pedido.id}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline flex items-center gap-1"
          >
            Marcar Entregue
          </button>
        </div>
      );
    }

    if (pedido.etiqueta_status === 'erro_saldo') {
      return (
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
            <AlertTriangle className="w-3 h-3" /> Erro de Saldo
          </span>
          <button
            onClick={() => handleTentarGerar(pedido.id)}
            disabled={processingId === pedido.id}
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition disabled:opacity-50"
          >
            {processingId === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Padrão com ação de entrega
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-yellow-600 text-xs">Processando envio...</span>
        <button
          onClick={() => handleMarcarEntregue(pedido.id)}
          disabled={processingId === pedido.id}
          className="text-xs text-emerald-700 hover:text-emerald-900 font-medium underline flex items-center gap-1"
        >
          Marcar Entregue
        </button>
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando pedidos...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-vinho-700" />
          Pedidos
        </h1>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPedidos}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-vinho-700 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>

          <Link
            to="/admin/nova-venda"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-vinho-800 px-4 py-2 rounded-lg hover:bg-vinho-900 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Venda Balcão
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-medium">Pedido ID</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Cliente / Origem</th>
                <th className="px-6 py-4 font-medium">Status Pgto</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium text-right">Logística / Canal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => {
                  const rua = pedido.enderecos?.rua || '';
                  const nomeCliente = rua.includes('Venda Presencial (')
                    ? rua.replace('Venda Presencial (', '').replace(')', '')
                    : pedido.enderecos?.usuarios?.nome || (pedido.melhor_envio_service_id === 0 ? 'Balcão / Presencial' : 'Usuário Deletado');
                  
                  const subinfo = pedido.enderecos?.usuarios?.email || (pedido.forma_pagamento ? `Pgto: ${pedido.forma_pagamento.toUpperCase()}` : 'Venda Física');

                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">#{pedido.id}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {(() => {
                          const d = pedido.data_pedido;
                          if (!d) return '';
                          if (d.length === 10) {
                            const [ano, mes, dia] = d.split('-');
                            return `${dia}/${mes}/${ano}`;
                          }
                          return new Date(d).toLocaleDateString('pt-BR');
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{nomeCliente}</div>
                        <div className="text-xs text-gray-500">{subinfo}</div>
                      </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        pedido.status === 'entregue' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        pedido.status === 'pago' ? 'bg-green-100 text-green-800' :
                        pedido.status === 'enviado' ? 'bg-blue-100 text-blue-800' :
                        pedido.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pedido.status === 'entregue' ? 'ENTREGUE' : pedido.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {renderEtiquetaStatus(pedido)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

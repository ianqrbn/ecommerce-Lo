import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, RefreshCw, Printer, AlertTriangle } from 'lucide-react';

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

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
          cidade,
          estado,
          usuarios (nome, email)
        )
      `)
      .eq('status', 'pago')
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
      // Em produção, isso seria feito através de uma chamada autenticada e usando a URL correta do Edge Function
      const { data: funcData, error } = await supabase.functions.invoke('print-shipping-label', {
        body: { order_id_me: melhor_envio_id }
      });

      if (error) throw error;

      if (funcData && funcData.url) {
        window.open(funcData.url, '_blank');
        fetchPedidos();
      } else {
        // As vezes a API do ME devolve o pdf diretamente ou num formato diferente, 
        // mas assumindo que devolve no padrão JSON de print.
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

  const renderEtiquetaStatus = (pedido: any) => {
    if (pedido.status !== 'pago') {
      return <span className="text-gray-400 text-xs">Aguardando Pagamento</span>;
    }

    if (pedido.etiqueta_status === 'impressa') {
      return (
        <div className="flex flex-col items-end gap-2">
          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded border border-green-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Etiqueta Impressa
          </span>
          <button
            onClick={() => handleImprimir(pedido.melhor_envio_id, pedido.id)}
            disabled={processingId === pedido.id}
            className="flex items-center gap-2 px-3 py-1 bg-white text-gray-600 border border-gray-200 text-xs rounded hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {processingId === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
            Reimprimir
          </button>
        </div>
      );
    }

    if (pedido.etiqueta_status === 'gerada') {
      return (
        <button
          onClick={() => handleImprimir(pedido.melhor_envio_id, pedido.id)}
          disabled={processingId === pedido.id}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {processingId === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
          Imprimir Etiqueta
        </button>
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
            className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {processingId === pedido.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Tentar Novamente
          </button>
        </div>
      );
    }

    // Pendente ou outro
    return <span className="text-yellow-600 text-xs">Gerando etiqueta...</span>;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando pedidos...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-serif text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-vinho-700" />
          Pedidos
        </h1>
        <button 
          onClick={fetchPedidos}
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
                <th className="px-6 py-4 font-medium">Pedido ID</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Status Pgto</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium text-right">Logística</th>
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
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">#{pedido.id}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {(() => {
                        const d = pedido.data_pedido;
                        if (!d) return '';
                        // Evita o bug de fuso horário onde "YYYY-MM-DD" vira meia noite UTC e cai pro dia anterior no Brasil
                        if (d.length === 10) {
                          const [ano, mes, dia] = d.split('-');
                          return `${dia}/${mes}/${ano}`;
                        }
                        return new Date(d).toLocaleDateString('pt-BR');
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{pedido.enderecos?.usuarios?.nome || 'Usuário Deletado'}</div>
                      <div className="text-xs text-gray-500">{pedido.enderecos?.usuarios?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pedido.status === 'pago' ? 'bg-green-100 text-green-800' :
                        pedido.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pedido.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      R$ {Number(pedido.total).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {renderEtiquetaStatus(pedido)}
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

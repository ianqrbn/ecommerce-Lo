import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Clock, 
  Package, 
  ShoppingBag, 
  Plus, 
  RefreshCw, 
  Store, 
  Globe, 
  AlertTriangle,
  Receipt,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Métricas
  const [vendasMes, setVendasMes] = useState(0);
  const [pedidosMesQtd, setPedidosMesQtd] = useState(0);
  const [vendasTotalGeral, setVendasTotalGeral] = useState(0);
  const [pedidosPendentes, setPedidosPendentes] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState<any[]>([]);

  // Separação Presencial vs Online
  const [vendasPresenciais, setVendasPresenciais] = useState({ qtd: 0, total: 0 });
  const [vendasOnline, setVendasOnline] = useState({ qtd: 0, total: 0 });

  // Lista de Últimas Vendas
  const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);

  useEffect(() => {
    fetchMetricas();
  }, []);

  const fetchMetricas = async () => {
    setLoading(true);
    try {
      // 1. Buscar todos os pedidos pagos e pendentes
      const { data: pedidos, error: pedError } = await supabase
        .from('pedidos')
        .select(`
          id,
          total,
          subtotal,
          frete,
          status,
          forma_pagamento,
          data_pedido,
          melhor_envio_service_id,
          enderecos (
            rua,
            cidade,
            usuarios (nome, email)
          )
        `)
        .order('data_pedido', { ascending: false });

      if (pedError) throw pedError;

      const todosPedidos = pedidos || [];
      const agora = new Date();
      const anoAtual = agora.getFullYear();
      const mesAtual = agora.getMonth(); // 0 a 11

      let somaMes = 0;
      let countMes = 0;
      let somaGeral = 0;
      let countPendentes = 0;

      let presencialQtd = 0;
      let presencialTotal = 0;
      let onlineQtd = 0;
      let onlineTotal = 0;

      todosPedidos.forEach((p) => {
        const valor = Number(p.total) || 0;
        const dataPed = p.data_pedido ? new Date(p.data_pedido) : null;

        if (p.status === 'pendente') {
          countPendentes++;
        }

        if (p.status === 'pago') {
          somaGeral += valor;

          // Venda Presencial vs Online
          const isPresencial = p.melhor_envio_service_id === 0 || p.forma_pagamento !== 'mercado_pago';
          if (isPresencial) {
            presencialQtd++;
            presencialTotal += valor;
          } else {
            onlineQtd++;
            onlineTotal += valor;
          }

          // Se for do mês atual
          if (dataPed && dataPed.getFullYear() === anoAtual && dataPed.getMonth() === mesAtual) {
            somaMes += valor;
            countMes++;
          }
        }
      });

      setVendasMes(somaMes);
      setPedidosMesQtd(countMes);
      setVendasTotalGeral(somaGeral);
      setPedidosPendentes(countPendentes);
      setVendasPresenciais({ qtd: presencialQtd, total: presencialTotal });
      setVendasOnline({ qtd: onlineQtd, total: onlineTotal });
      setUltimasVendas(todosPedidos.slice(0, 8));

      // 2. Buscar Produtos e Estoques Baixos
      const { data: produtos, error: prodError } = await supabase
        .from('produtos')
        .select('id, nome, preco, estoque, ativo')
        .eq('ativo', true);

      if (!prodError && produtos) {
        setTotalProdutos(produtos.length);
        const baixos = produtos.filter((prod) => (prod.estoque || 0) <= 3);
        setProdutosEstoqueBaixo(baixos);
      }
    } catch (err) {
      console.error('Erro ao buscar métricas do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNomeMesAtual = () => {
    return new Date().toLocaleDateString('pt-BR', { month: 'long' });
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visão geral de desempenho financeiro, estoque e canais de venda (Online e Presencial).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetricas}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer shadow-xs"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={() => navigate('/admin/nova-venda')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-vinho-800 rounded-lg hover:bg-vinho-900 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            Registrar Venda Presencial
          </button>
        </div>
      </div>

      {/* Grid de Cards Principais (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Vendas do Mês */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Vendas no Mês ({getNomeMesAtual()})
            </span>
            <div className="w-9 h-9 rounded-xl bg-vinho-50 text-vinho-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-gray-900 mt-1">
            R$ {vendasMes.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-xs text-gray-500 mt-2">
            {pedidosMesQtd} {pedidosMesQtd === 1 ? 'venda confirmada' : 'vendas confirmadas'} este mês
          </span>
        </div>

        {/* Faturamento Total Histórico */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Total Faturado
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-gray-900 mt-1">
            R$ {vendasTotalGeral.toFixed(2).replace('.', ',')}
          </p>
          <span className="text-xs text-emerald-600 font-medium mt-2">
            Histórico completo de pedidos pagos
          </span>
        </div>

        {/* Pedidos Pendentes */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Pedidos Pendentes
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-gray-900 mt-1">
            {pedidosPendentes}
          </p>
          <span className="text-xs text-gray-500 mt-2">
            Aguardando confirmação de pagamento
          </span>
        </div>

        {/* Produtos Ativos */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Produtos Ativos
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-gray-900 mt-1">
            {totalProdutos}
          </p>
          <span className="text-xs text-gray-500 mt-2">
            Disponíveis no catálogo da loja
          </span>
        </div>
      </div>

      {/* Seção Central: Canais de Venda e Alertas de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Distribuição por Canais (Presencial vs Online) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
            <div>
              <h2 className="font-serif font-bold text-gray-900 text-lg">Canais de Venda</h2>
              <p className="text-xs text-gray-500">Divisão entre vendas presenciais e pedidos do site</p>
            </div>
            <Link
              to="/admin/nova-venda"
              className="text-xs text-vinho-700 font-semibold hover:underline flex items-center gap-1"
            >
              Nova Venda Balcão <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cartão Presencial / Balcão */}
            <div className="p-4 rounded-xl bg-vinho-50/50 border border-vinho-100 flex items-start gap-4">
              <div className="p-3 bg-vinho-800 text-white rounded-xl flex-shrink-0 shadow-xs">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-vinho-800">
                  Presencial / Balcão
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {vendasPresenciais.total.toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-vinho-200/60 text-xs text-vinho-900">
                  <span>{vendasPresenciais.qtd} vendas registradas</span>
                  <span className="font-semibold">
                    {vendasTotalGeral > 0
                      ? `${Math.round((vendasPresenciais.total / vendasTotalGeral) * 100)}% do total`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cartão Online / Site */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-4">
              <div className="p-3 bg-gray-800 text-white rounded-xl flex-shrink-0 shadow-xs">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Loja Virtual (Site)
                </span>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  R$ {vendasOnline.total.toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                  <span>{vendasOnline.qtd} pedidos pagos</span>
                  <span className="font-semibold">
                    {vendasTotalGeral > 0
                      ? `${Math.round((vendasOnline.total / vendasTotalGeral) * 100)}% do total`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estoque Baixo / Alerta */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="font-serif font-bold text-gray-900 text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Estoque Crítico
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                {produtosEstoqueBaixo.length} itens
              </span>
            </div>

            {produtosEstoqueBaixo.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                Nenhum produto com estoque crítico no momento.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {produtosEstoqueBaixo.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                  >
                    <span className="font-medium text-gray-800 truncate mr-2">{p.nome}</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold whitespace-nowrap ${
                        p.estoque === 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.estoque === 0 ? 'Esgotado' : `${p.estoque} un`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/admin/produtos"
            className="mt-4 text-xs font-semibold text-vinho-700 hover:text-vinho-900 text-center block pt-2 border-t border-gray-100"
          >
            Gerenciar Inventário Completo &rarr;
          </Link>
        </div>
      </div>

      {/* Tabela de Últimas Vendas */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-gray-900 text-lg">Últimas Vendas Realizadas</h2>
            <p className="text-xs text-gray-500">Histórico recente de pedidos do site e vendas de balcão</p>
          </div>
          <Link
            to="/admin/pedidos"
            className="text-xs font-semibold text-vinho-700 hover:underline flex items-center gap-1"
          >
            Ver Todos os Pedidos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Pedido</th>
                <th className="px-6 py-3.5 font-semibold">Data</th>
                <th className="px-6 py-3.5 font-semibold">Canal</th>
                <th className="px-6 py-3.5 font-semibold">Cliente / Origem</th>
                <th className="px-6 py-3.5 font-semibold">Pagamento</th>
                <th className="px-6 py-3.5 font-semibold">Total</th>
                <th className="px-6 py-3.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ultimasVendas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-xs">
                    Nenhuma venda registrada ainda.
                  </td>
                </tr>
              ) : (
                ultimasVendas.map((venda) => {
                  const isPresencial = venda.melhor_envio_service_id === 0 || venda.forma_pagamento !== 'mercado_pago';
                  const nomeCliente = venda.enderecos?.usuarios?.nome || (venda.enderecos?.rua?.includes('(') ? venda.enderecos.rua.replace('Venda Presencial (', '').replace(')', '') : 'Balcão / Presencial');

                  return (
                    <tr key={venda.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900 text-xs">
                        #{venda.id}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {venda.data_pedido
                          ? new Date(venda.data_pedido).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {isPresencial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-vinho-100 text-vinho-800 border border-vinho-200">
                            <Store className="w-3 h-3" />
                            Presencial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Globe className="w-3 h-3" />
                            Site
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-900">
                        {nomeCliente}
                      </td>
                      <td className="px-6 py-4 text-xs uppercase text-gray-600 font-mono">
                        {venda.forma_pagamento || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-900">
                        R$ {Number(venda.total || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            venda.status === 'pago'
                              ? 'bg-emerald-100 text-emerald-800'
                              : venda.status === 'cancelado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {venda.status.toUpperCase()}
                        </span>
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

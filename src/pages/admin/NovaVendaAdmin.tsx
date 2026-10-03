import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  Package, 
  Receipt,
  Printer
} from 'lucide-react';

interface ProdutoVariacao {
  id: string;
  nome: string;
  estoque: number;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagem_principal?: string;
  ativo: boolean;
  produto_variacoes?: ProdutoVariacao[];
}

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  precoUnitario: number;
  quantidade: number;
  imagem?: string;
  tamanho?: string;
  variacaoId?: string;
  estoqueMaximo: number;
}

export default function NovaVendaAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados de catálogo
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [busca, setBusca] = useState('');
  const [tamanhoSelecionadoPorProduto, setTamanhoSelecionadoPorProduto] = useState<Record<string, string>>({});

  // Estados da venda
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'outro'>('pix');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [descontoExtra, setDescontoExtra] = useState<number>(0);
  const [dataVenda, setDataVenda] = useState(() => new Date().toISOString().slice(0, 16));

  // Estados de submissão e modal
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [vendaConcluida, setVendaConcluida] = useState<any>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    setLoadingProdutos(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id,
          nome,
          preco,
          estoque,
          imagem_principal,
          ativo,
          produto_variacoes (
            id,
            nome,
            estoque
          )
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar produtos:', err);
      setErroMsg('Falha ao carregar catálogo de produtos.');
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Filtra produtos pela busca
  const produtosFiltrados = produtos.filter((p) => {
    const termo = busca.toLowerCase().trim();
    if (!termo) return true;
    return p.nome.toLowerCase().includes(termo) || p.id.toString().includes(termo);
  });

  // Manipulação do tamanho selecionado para um card
  const handleSelecionarTamanho = (produtoId: string, tamanhoNome: string) => {
    setTamanhoSelecionadoPorProduto((prev) => ({
      ...prev,
      [produtoId]: tamanhoNome
    }));
  };

  // Adicionar ao carrinho da venda
  const handleAdicionarAoCarrinho = (produto: Produto) => {
    setErroMsg(null);
    const temVariacoes = produto.produto_variacoes && produto.produto_variacoes.length > 0;
    let tamanhoEscolhido: string | undefined = undefined;
    let variacaoEscolhida: ProdutoVariacao | undefined = undefined;
    let estoqueDisponivel = produto.estoque || 0;

    if (temVariacoes) {
      const tamanhoSalvo = tamanhoSelecionadoPorProduto[produto.id];
      if (!tamanhoSalvo) {
        // Seleciona a primeira variação com estoque > 0 como padrão
        const primeiraComEstoque = produto.produto_variacoes?.find((v) => v.estoque > 0) || produto.produto_variacoes?.[0];
        if (primeiraComEstoque) {
          tamanhoEscolhido = primeiraComEstoque.nome;
          variacaoEscolhida = primeiraComEstoque;
          estoqueDisponivel = primeiraComEstoque.estoque;
        }
      } else {
        variacaoEscolhida = produto.produto_variacoes?.find((v) => v.nome === tamanhoSalvo);
        tamanhoEscolhido = tamanhoSalvo;
        if (variacaoEscolhida) {
          estoqueDisponivel = variacaoEscolhida.estoque;
        }
      }
    }

    if (estoqueDisponivel <= 0) {
      setErroMsg(`O produto "${produto.nome}" ${tamanhoEscolhido ? `(Tam: ${tamanhoEscolhido})` : ''} está sem estoque disponível.`);
      return;
    }

    setCarrinho((prev) => {
      // Verifica se já existe o mesmo produto e mesmo tamanho no carrinho
      const indexExistente = prev.findIndex(
        (item) => item.produtoId === produto.id && item.tamanho === tamanhoEscolhido
      );

      if (indexExistente >= 0) {
        const itemAtual = prev[indexExistente];
        if (itemAtual.quantidade + 1 > estoqueDisponivel) {
          setErroMsg(`Limite de estoque atingido para "${produto.nome}" (${estoqueDisponivel} un).`);
          return prev;
        }
        const novoCarrinho = [...prev];
        novoCarrinho[indexExistente] = {
          ...itemAtual,
          quantidade: itemAtual.quantidade + 1
        };
        return novoCarrinho;
      }

      return [
        ...prev,
        {
          produtoId: produto.id,
          nome: produto.nome,
          precoUnitario: Number(produto.preco) || 0,
          quantidade: 1,
          imagem: produto.imagem_principal,
          tamanho: tamanhoEscolhido,
          variacaoId: variacaoEscolhida?.id,
          estoqueMaximo: estoqueDisponivel
        }
      ];
    });
  };

  // Alterar quantidade
  const handleAlterarQuantidade = (index: number, novaQtd: number) => {
    setErroMsg(null);
    setCarrinho((prev) => {
      const item = prev[index];
      if (novaQtd <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      if (novaQtd > item.estoqueMaximo) {
        setErroMsg(`Estoque máximo disponível para este item é ${item.estoqueMaximo} unidades.`);
        return prev;
      }
      const atualizado = [...prev];
      atualizado[index] = { ...item, quantidade: novaQtd };
      return atualizado;
    });
  };

  // Alterar preço negociado
  const handleAlterarPrecoUnitario = (index: number, novoPreco: number) => {
    setCarrinho((prev) => {
      const atualizado = [...prev];
      atualizado[index] = { ...atualizado[index], precoUnitario: Math.max(0, novoPreco) };
      return atualizado;
    });
  };

  // Remover item
  const handleRemoverItem = (index: number) => {
    setCarrinho((prev) => prev.filter((_, i) => i !== index));
  };

  // Totais
  const subtotal = carrinho.reduce((acc, item) => acc + item.precoUnitario * item.quantidade, 0);
  const total = Math.max(0, subtotal - Number(descontoExtra || 0));

  // Registrar a venda no Supabase
  const handleFinalizarVenda = async () => {
    if (carrinho.length === 0) {
      setErroMsg('Adicione pelo menos um produto ao carrinho para registrar a venda.');
      return;
    }
    if (!user) {
      setErroMsg('Usuário não autenticado.');
      return;
    }

    setSalvandoVenda(true);
    setErroMsg(null);

    try {
      // 1. Criar registro de endereço para a venda presencial
      const descricaoLocal = clienteNome 
        ? `Venda Presencial (${clienteNome.trim()})`
        : 'Venda Presencial / Balcão';

      const { data: endData, error: endError } = await supabase
        .from('enderecos')
        .insert({
          usuario_id: user.id,
          cep: '00000-000',
          rua: descricaoLocal,
          numero: 'S/N',
          complemento: clienteTelefone ? `Tel: ${clienteTelefone}` : observacoes ? `Obs: ${observacoes}` : null,
          bairro: 'Balcão / Presencial',
          cidade: 'Venda Física',
          estado: 'SP',
          tipo: 'comercial'
        })
        .select()
        .single();

      if (endError) {
        console.warn('Erro ao criar endereço presencial, tentando sem endereço:', endError);
      }

      // 2. Criar o Pedido marcado como pago
      const dataFormatada = dataVenda ? new Date(dataVenda).toISOString() : new Date().toISOString();

      const { data: pedData, error: pedError } = await supabase
        .from('pedidos')
        .insert({
          endereco_entrega_id: endData?.id || null,
          status: 'pago',
          subtotal: subtotal,
          frete: 0,
          total: total,
          desconto_aplicado: Number(descontoExtra || 0),
          forma_pagamento: formaPagamento,
          data_pedido: dataFormatada,
          melhor_envio_service_id: 0, // 0 = Retirada / Venda presencial
          etiqueta_status: 'presencial'
        })
        .select()
        .single();

      if (pedError) throw new Error('Erro ao criar registro da venda: ' + pedError.message);

      // 3. Inserir os Itens do Pedido
      const orderItems = carrinho.map((item) => ({
        pedido_id: pedData.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
        tamanho: item.tamanho || null
      }));

      const { error: itemsError } = await supabase
        .from('itens_pedido')
        .insert(orderItems);

      if (itemsError) throw new Error('Erro ao salvar os itens da venda: ' + itemsError.message);

      // 4. Descontar o Estoque dos Produtos e das Variações
      for (const item of carrinho) {
        // Atualiza a tabela produtos (estoque geral)
        const produtoOriginal = produtos.find((p) => p.id === item.produtoId);
        if (produtoOriginal) {
          const novoEstoqueGeral = Math.max(0, (produtoOriginal.estoque || 0) - item.quantidade);
          await supabase
            .from('produtos')
            .update({ estoque: novoEstoqueGeral })
            .eq('id', item.produtoId);
        }

        // Se tiver variação de tamanho, atualiza produto_variacoes
        if (item.variacaoId) {
          const { data: varAtual } = await supabase
            .from('produto_variacoes')
            .select('estoque')
            .eq('id', item.variacaoId)
            .single();

          if (varAtual) {
            const novoEstoqueVar = Math.max(0, (varAtual.estoque || 0) - item.quantidade);
            await supabase
              .from('produto_variacoes')
              .update({ estoque: novoEstoqueVar })
              .eq('id', item.variacaoId);
          }
        }
      }

      // 5. Sucesso!
      setVendaConcluida({
        pedidoId: pedData.id,
        itens: [...carrinho],
        subtotal,
        descontoExtra,
        total,
        formaPagamento,
        clienteNome,
        data: dataFormatada
      });

      // Recarrega o catálogo atualizado com os novos estoques
      fetchProdutos();
    } catch (err: any) {
      console.error('Erro ao processar venda presencial:', err);
      setErroMsg(err.message || 'Erro inesperado ao registrar a venda.');
    } finally {
      setSalvandoVenda(false);
    }
  };

  const handleNovaVendaAposSucesso = () => {
    setCarrinho([]);
    setClienteNome('');
    setClienteTelefone('');
    setObservacoes('');
    setDescontoExtra(0);
    setDataVenda(new Date().toISOString().slice(0, 16));
    setVendaConcluida(null);
    setErroMsg(null);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto font-sans">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
              title="Voltar ao Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-vinho-700" />
              Registrar Venda Presencial / Balcão
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 pl-9">
            Lance vendas presenciais, de eventos ou WhatsApp. Os produtos serão abatidos do inventário e computados no Dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/pedidos')}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-xs"
          >
            Ver Histórico de Pedidos
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-sm text-white bg-vinho-800 rounded-lg hover:bg-vinho-900 transition shadow-xs"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Alerta de Erro */}
      {erroMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{erroMsg}</span>
          </div>
          <button onClick={() => setErroMsg(null)} className="text-red-600 hover:text-red-800 font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Layout Principal: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: CATÁLOGO DE PRODUTOS (7 Colunas) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar produto por nome ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-vinho-500 text-sm"
              />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {produtosFiltrados.length} produtos disponíveis
            </span>
          </div>

          {/* Grid de Produtos */}
          {loadingProdutos ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-vinho-600 animate-spin" />
              <span className="text-sm text-gray-500">Carregando catálogo...</span>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500">
              Nenhum produto encontrado com o termo "{busca}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[720px] overflow-y-auto pr-1">
              {produtosFiltrados.map((prod) => {
                const temVariacoes = prod.produto_variacoes && prod.produto_variacoes.length > 0;
                const tamanhoAtual = tamanhoSelecionadoPorProduto[prod.id] || (temVariacoes ? prod.produto_variacoes![0]?.nome : '');
                
                // Calcula estoque da variação ou estoque geral
                const varSelecionada = temVariacoes 
                  ? prod.produto_variacoes?.find((v) => v.nome === tamanhoAtual)
                  : null;
                const estoqueReal = temVariacoes ? (varSelecionada?.estoque || 0) : prod.estoque;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-xl border border-gray-200 p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow group"
                  >
                    <div>
                      {/* Imagem do Produto */}
                      <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 relative border border-gray-100 flex items-center justify-center">
                        {prod.imagem_principal ? (
                          <img
                            src={prod.imagem_principal}
                            alt={prod.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-gray-300" />
                        )}

                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            estoqueReal > 5
                              ? 'bg-emerald-100 text-emerald-800'
                              : estoqueReal > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {estoqueReal > 0 ? `${estoqueReal} em estoque` : 'Esgotado'}
                        </span>
                      </div>

                      {/* Nome e Preço */}
                      <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1" title={prod.nome}>
                        {prod.nome}
                      </h3>
                      <p className="text-base font-bold text-vinho-700">
                        R$ {Number(prod.preco || 0).toFixed(2).replace('.', ',')}
                      </p>

                      {/* Seletor de Tamanhos se houver */}
                      {temVariacoes && (
                        <div className="mt-2.5">
                          <label className="text-xs text-gray-500 mb-1 block">Tamanho:</label>
                          <div className="flex flex-wrap gap-1.5">
                            {prod.produto_variacoes!.map((v) => {
                              const isSelected = v.nome === tamanhoAtual;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelecionarTamanho(prod.id, v.nome)}
                                  className={`px-2 py-0.5 text-xs rounded border transition cursor-pointer ${
                                    isSelected
                                      ? 'border-vinho-700 bg-vinho-50 text-vinho-800 font-semibold'
                                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                                  }`}
                                >
                                  {v.nome} ({v.estoque})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botão Adicionar */}
                    <button
                      onClick={() => handleAdicionarAoCarrinho(prod)}
                      disabled={estoqueReal <= 0}
                      className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                        estoqueReal <= 0
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-vinho-800 text-white hover:bg-vinho-900 cursor-pointer shadow-xs'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar à Venda
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: RESUMO E FINALIZAÇÃO DA VENDA (5 Colunas) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h2 className="font-serif font-bold text-gray-900 text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-vinho-700" />
                Resumo da Venda
              </h2>
              {carrinho.length > 0 && (
                <button
                  onClick={() => setCarrinho([])}
                  className="text-xs text-red-500 hover:text-red-700 transition cursor-pointer"
                >
                  Limpar Itens
                </button>
              )}
            </div>

            {/* Lista dos Itens Selecionados */}
            <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-1">
              {carrinho.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                  <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  Nenhum produto adicionado ainda.<br />
                  Selecione itens no catálogo ao lado.
                </div>
              ) : (
                carrinho.map((item, index) => (
                  <div
                    key={`${item.produtoId}-${item.tamanho || 'padrao'}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/60 transition gap-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.imagem ? (
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="w-10 h-10 object-cover rounded border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 text-gray-400">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.nome}</p>
                        {item.tamanho && (
                          <span className="text-[11px] text-vinho-700 bg-vinho-50 px-1.5 py-0.5 rounded font-medium">
                            Tam: {item.tamanho}
                          </span>
                        )}
                        <p className="text-xs text-gray-500">
                          R$ {item.precoUnitario.toFixed(2).replace('.', ',')} un
                        </p>
                      </div>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAlterarQuantidade(index, item.quantidade - 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-gray-800">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => handleAlterarQuantidade(index, item.quantidade + 1)}
                        disabled={item.quantidade >= item.estoqueMaximo}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoverItem(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition cursor-pointer ml-1"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Informações Complementares da Venda */}
            <div className="space-y-4 pt-4 border-t border-gray-100 text-sm">
              
              {/* Forma de Pagamento */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Forma de Pagamento Recebida *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pix', label: 'PIX', icon: QrCode },
                    { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                    { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
                    { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
                    { id: 'outro', label: 'Outro', icon: Receipt },
                  ].map((fp) => {
                    const isSelected = formaPagamento === fp.id;
                    const Icon = fp.icon;
                    return (
                      <button
                        key={fp.id}
                        type="button"
                        onClick={() => setFormaPagamento(fp.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs rounded-lg border font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border-vinho-700 bg-vinho-50 text-vinho-900 font-bold'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {fp.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dados do Cliente (Opcional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nome do Cliente (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Marina Silva"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-vinho-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">WhatsApp / Telefone (opcional)</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-vinho-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Data da Venda e Desconto Extra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Data / Hora da Venda</label>
                  <input
                    type="datetime-local"
                    value={dataVenda}
                    onChange={(e) => setDataVenda(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-vinho-600 focus:outline-none text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desconto Extra (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={descontoExtra || ''}
                    onChange={(e) => setDescontoExtra(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-vinho-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Observação / Notas */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Observações internas</label>
                <input
                  type="text"
                  placeholder="Ex: Venda na feira de artesanato / WhatsApp"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-vinho-600 focus:outline-none"
                />
              </div>

              {/* Resumo Financeiro */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2 mt-4 border border-gray-100">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal ({carrinho.reduce((a, b) => a + b.quantidade, 0)} itens):</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {descontoExtra > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Desconto aplicado:</span>
                    <span>- R$ {Number(descontoExtra).toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Frete / Logística:</span>
                  <span className="text-gray-900 font-medium">R$ 0,00 (Presencial)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total a Cobrar:</span>
                  <span className="text-xl text-vinho-800">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Botão de Finalização */}
              <button
                type="button"
                onClick={handleFinalizarVenda}
                disabled={salvandoVenda || carrinho.length === 0}
                className="w-full py-3.5 px-4 bg-vinho-800 text-white rounded-xl font-bold text-sm hover:bg-vinho-900 transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvandoVenda ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando e debitando estoque...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar e Concluir Venda
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE SUCESSO DA VENDA */}
      {vendaConcluida && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900">Venda Registrada com Sucesso!</h2>
              <p className="text-sm text-gray-500 mt-1">
                Pedido <strong>#{vendaConcluida.pedidoId}</strong> gerado e estoque abatido automaticamente.
              </p>
            </div>

            {/* Recibo Simplificado */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-2 mb-2 font-semibold text-xs text-gray-600">
                <span>ITENS VENDIDOS</span>
                <span>SUBTOTAL</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {vendaConcluida.itens.map((item: ItemCarrinho, i: number) => (
                  <div key={i} className="flex justify-between text-xs text-gray-800">
                    <span>
                      {item.quantidade}x {item.nome} {item.tamanho ? `(Tam: ${item.tamanho})` : ''}
                    </span>
                    <span className="font-mono">
                      R$ {(item.precoUnitario * item.quantidade).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-2 mt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Forma de Pagamento:</span>
                  <span className="font-semibold uppercase">{vendaConcluida.formaPagamento}</span>
                </div>
                {vendaConcluida.clienteNome && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Cliente:</span>
                    <span>{vendaConcluida.clienteNome}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Pago:</span>
                  <span className="text-vinho-800">R$ {vendaConcluida.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            {/* Ações pós-venda */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Recibo
              </button>
              <button
                onClick={handleNovaVendaAposSucesso}
                className="flex-1 py-2.5 px-4 bg-vinho-800 text-white rounded-lg text-xs font-semibold hover:bg-vinho-900 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Nova Venda
              </button>
            </div>
            <div className="text-center mt-3">
              <button
                onClick={() => navigate('/admin')}
                className="text-xs text-gray-500 hover:text-vinho-800 transition"
              >
                Ir para o Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

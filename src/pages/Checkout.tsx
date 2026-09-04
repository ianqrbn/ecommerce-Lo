import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { ShippingCalculator } from '../components/ShippingCalculator';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';


initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || 'APP_USR-0c0ce8f3-c173-450b-959c-26d827c36b4c', { locale: 'pt-BR' });

export default function Checkout() {
  const { cart, cartTotal, cartDiscount, cartTotalWithDiscount, appliedCoupon, setAppliedCoupon, clearCart } = useCart();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  
  const [useCreditoLoja, setUseCreditoLoja] = useState(false);
  
  // Cálculos de Totais
  const subtotalWithFrete = cartTotalWithDiscount + (selectedShipping ? Number(selectedShipping.price) : 0);
  const creditoDisponivel = profile?.credito_loja || 0;
  const creditoAplicado = useCreditoLoja ? Math.min(creditoDisponivel, subtotalWithFrete) : 0;
  const finalTotal = subtotalWithFrete - creditoAplicado;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    
    try {
      const code = couponCode.toUpperCase().trim();
      
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', code)
        .eq('ativo', true)
        .single();
        
      if (error || !data) {
        throw new Error('Cupom inválido ou expirado.');
      }
      
      if (data.data_validade && new Date(data.data_validade) < new Date()) {
        throw new Error('Cupom expirado.');
      }
      
      if (data.quantidade_maxima && data.usos_atuais >= data.quantidade_maxima) {
        throw new Error('Este cupom já atingiu o limite de usos.');
      }
      
      if (data.limite_por_cliente && user) {
        const { count, error: countError } = await supabase
          .from('pedidos')
          .select('*', { count: 'exact', head: true })
          .eq('cupom_id', data.id)
          .not('status', 'in', '("cancelado", "pendente")');
          
        // Wait, we need to check if THIS user used it. 
        // Better: join with enderecos to filter by user.id
        const { data: userOrders } = await supabase
          .from('pedidos')
          .select('id, enderecos!inner(usuario_id)')
          .eq('cupom_id', data.id)
          .eq('enderecos.usuario_id', user.id);
          
        if (userOrders && userOrders.length >= data.limite_por_cliente) {
          throw new Error('Você já atingiu o limite de usos para este cupom.');
        }
      }
      
      setAppliedCoupon(data);
      alert('Cupom aplicado com sucesso!');
      setCouponCode('');
    } catch (err: any) {
      alert(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const shippingItems = useMemo(() => {
    return cart.map(item => ({ id: item.id.toString(), quantity: item.quantidade }));
  }, [cart]);

  // Endereco Form
  const [endereco, setEndereco] = useState({
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    tipo: 'Casa' // Default
  });

  const handleEnderecoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    
    // Máscara de CEP
    if (name === 'cep') {
      value = value.replace(/\D/g, '');
      if (value.length > 5) {
        value = value.replace(/^(\d{5})(\d)/, '$1-$2');
      }
      if (value.length > 9) {
        value = value.slice(0, 9);
      }
    }

    setEndereco({ ...endereco, [name]: value });
  };

  // Busca de CEP automático via ViaCEP
  useEffect(() => {
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setEndereco(prev => ({
              ...prev,
              rua: data.logradouro || prev.rua,
              bairro: data.bairro || prev.bairro,
              cidade: data.localidade || prev.cidade,
              estado: data.uf || prev.estado,
            }));
          }
        })
        .catch(err => console.error("Erro ao buscar CEP:", err));
    }
  }, [endereco.cep]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Você precisa estar logado para finalizar a compra.');
      return;
    }
    if (cart.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }

    setLoading(true);

    try {
      // 1. Salvar ou atualizar Endereço
      const { data: endData, error: endError } = await supabase
        .from('enderecos')
        .insert({
          usuario_id: user.id,
          cep: endereco.cep,
          rua: endereco.rua,
          numero: endereco.numero,
          complemento: endereco.complemento,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          estado: endereco.estado,
          tipo: endereco.tipo
        })
        .select()
        .single();

      if (endError) throw new Error('Erro ao salvar endereço: ' + endError.message);

      // 2. Criar o Pedido
      const frete = selectedShipping ? Number(selectedShipping.price) : 0;
      const total = cartTotalWithDiscount + frete;

      const { data: pedData, error: pedError } = await supabase
        .from('pedidos')
        .insert({
          endereco_entrega_id: endData.id,
          status: 'pendente',
          subtotal: cartTotal, // O subtotal original
          frete: frete,
          total: total, // Total final cobrado (Subtotal - Desconto + Frete)
          cupom_id: appliedCoupon?.id || null,
          desconto_aplicado: cartDiscount,
          forma_pagamento: 'mercado_pago',
          data_pedido: new Date().toISOString(),
          melhor_envio_service_id: selectedShipping ? selectedShipping.id : 1, // Fallback para PAC(1)
        })
        .select()
        .single();

      if (pedError) throw new Error('Erro ao criar pedido: ' + pedError.message);

      // 2.5 Inserir os Itens do Pedido
      // O desconto será repassado para o Mercado Pago ajustando o unit_price, mas no nosso BD mantemos o preço real
      const orderItems = cart.map((item) => ({
        pedido_id: pedData.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        tamanho: item.tamanho || null
      }));

      const { error: itemsError } = await supabase
        .from('itens_pedido')
        .insert(orderItems);

      if (itemsError) throw new Error('Erro ao salvar itens do pedido: ' + itemsError.message);

      // 3. Chamar a Edge Function para gerar a Preference do MP
      const itemsForMP = cart.map((item) => {
        // Se houver desconto, o MP exige que o unit_price de cada item seja reduzido proporcionalmente
        // Para simplificar e evitar erros de arredondamento, a Edge Function cuidará disso.
        // Apenas enviamos o cupom na requisição.
        return {
          id: item.id.toString(),
          title: item.nome,
          quantity: item.quantidade,
          unit_price: item.preco
        };
      });

      if (frete > 0) {
        itemsForMP.push({
          id: 'frete',
          title: `Frete - ${selectedShipping?.name || 'Entrega'}`,
          quantity: 1,
          unit_price: frete
        });
      }

      // No Vite, chamamos a function através da URL do Supabase ou localhost no dev
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/create-preference`;
      // Em dev local, a porta padrão da CLI é 54321
      const isLocal = supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1');
      const finalUrl = isLocal ? 'http://127.0.0.1:54321/functions/v1/create-preference' : functionUrl;

      const mpResponse = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          items: itemsForMP,
          payer: {
            email: user.email
          },
          external_reference: pedData.id.toString(),
          coupon_code: appliedCoupon?.codigo, // Passando o código para a Edge Function revalidar
          credito_aplicado: creditoAplicado // Novo: repassa crédito usado
        })
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        throw new Error('Erro ao gerar preferência de pagamento: ' + (mpData.error || 'Erro desconhecido'));
      }

      if (mpData.paid_with_credit) {
        // Pedido totalmente pago com crédito
        alert('Pedido finalizado com sucesso usando Crédito em Loja!');
        clearCart();
        window.location.href = '/perfil';
        return;
      }

      setPreferenceId(mpData.preferenceId);

      // 4. Salvar registro do Pagamento (Opcional neste momento do fluxo)
      await supabase.from('pagamentos').insert({
        pedido_id: pedData.id,
        status_pagamento: 'pending',
        metodo_pagamento: 'mercado_pago',
        mercadopago_preference_id: mpData.preferenceId,
        valor: total,
        data_criacao: new Date().toISOString(),
      });

      // Clear the cart? Ou deixar para limpar apenas no sucesso
      // clearCart();

    } catch (error: any) {
      alert(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Previne que o botão do Mercado Pago seja renderizado duas vezes
  // quando o componente sofre re-render (ex: quando o loading muda pra false)
  const renderWallet = useMemo(() => {
    if (!preferenceId) return null;
    return (
      <div className="mt-4 border-t border-gray-100 pt-6">
        <p className="text-sm text-center text-gray-600 mb-4">
          Escolha como deseja pagar de forma 100% segura pelo Mercado Pago:
        </p>
        <Wallet initialization={{ preferenceId: preferenceId }} />
      </div>
    );
  }, [preferenceId]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 pt-32">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Coluna Principal - Formulário */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-serif text-gray-900 mb-6">Endereço de Entrega</h2>

              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input required name="cep" value={endereco.cep} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" placeholder="00000-000" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input required name="bairro" value={endereco.bairro} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" />
                  </div>

                  <div className="col-span-2 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                    <input required name="rua" value={endereco.rua} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input required name="numero" value={endereco.numero} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                    <input name="complemento" value={endereco.complemento} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" placeholder="Opcional" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                    <input required name="cidade" value={endereco.cidade} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <input required name="estado" value={endereco.estado} onChange={handleEnderecoChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-vinho-500 focus:border-vinho-500" placeholder="UF" />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-xl font-serif text-gray-900 mb-6">Opções de Entrega</h2>
              <ShippingCalculator 
                items={shippingItems} 
                initialCep={endereco.cep} 
                autoCalculate={true} 
                onSelectOption={setSelectedShipping}
                selectedOptionId={selectedShipping?.id}
              />
            </div>
          </div>

          {/* Coluna Lateral - Resumo e Pagamento */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-100 sticky top-32">
              <h2 className="text-xl font-serif text-gray-900 mb-6">Resumo do Pedido</h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.cartItemId || item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium text-gray-600">{item.quantidade}x</span>
                      <div className="flex flex-col">
                        <span className="text-gray-900 line-clamp-1">{item.nome}</span>
                        {item.tamanho && <span className="text-xs text-gray-500">Tamanho: {item.tamanho}</span>}
                      </div>
                    </div>
                    <span className="text-gray-900 font-medium">
                      R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cupom de Desconto Input */}
              <div className="mb-6 pt-4 border-t border-gray-100">
                {!appliedCoupon ? (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cupom de Desconto</label>
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Ex: PRIMEIRACOMPRA" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md uppercase focus:ring-vinho-500 focus:border-vinho-500 text-sm"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Aplicar'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-md flex items-center justify-between">
                    <div>
                      <span className="block text-xs text-green-800 font-medium uppercase">{appliedCoupon.codigo}</span>
                      <span className="text-sm text-green-700">
                        {appliedCoupon.tipo === 'porcentagem' ? `${appliedCoupon.valor}% de desconto` : `R$ ${appliedCoupon.valor.toFixed(2)} de desconto`}
                      </span>
                    </div>
                    <button 
                      onClick={() => setAppliedCoupon(null)}
                      className="text-red-600 text-xs hover:underline font-medium"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Desconto</span>
                    <span>- R$ {cartDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                
                {creditoDisponivel > 0 && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-vinho-700 focus:ring-vinho-700 cursor-pointer"
                        checked={useCreditoLoja}
                        onChange={(e) => setUseCreditoLoja(e.target.checked)}
                      />
                      <span className="text-gray-700 font-medium">Usar Crédito em Loja (Saldo: R$ {creditoDisponivel.toFixed(2).replace('.', ',')})</span>
                    </label>
                    {useCreditoLoja && creditoAplicado > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Crédito Aplicado</span>
                        <span>- R$ {creditoAplicado.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-gray-600 pt-2 border-t border-gray-100">
                  <span>Frete</span>
                  <span>{selectedShipping ? `R$ ${Number(selectedShipping.price).toFixed(2).replace('.', ',')}` : 'A calcular'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {!preferenceId ? (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading || cart.length === 0 || !selectedShipping}
                  className="w-full bg-vinho-700 text-white py-3 rounded-md font-medium hover:bg-vinho-800 transition-colors disabled:opacity-50 flex justify-center"
                >
                  {loading ? 'Processando...' : !selectedShipping ? 'Selecione o Frete' : 'Ir para Pagamento'}
                </button>
              ) : (
                renderWallet
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

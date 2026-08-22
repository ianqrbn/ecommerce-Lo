import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/Header';
import { ShippingCalculator } from '../components/ShippingCalculator';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';


initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY || 'APP_USR-0c0ce8f3-c173-450b-959c-26d827c36b4c', { locale: 'pt-BR' });

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);

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
      const total = cartTotal + frete;

      const { data: pedData, error: pedError } = await supabase
        .from('pedidos')
        .insert({
          endereco_entrega_id: endData.id,
          status: 'pendente',
          subtotal: cartTotal,
          frete: frete,
          total: total,
          forma_pagamento: 'mercado_pago',
          data_pedido: new Date().toISOString(),
          melhor_envio_service_id: selectedShipping ? selectedShipping.id : 1, // Fallback para PAC(1)
        })
        .select()
        .single();

      if (pedError) throw new Error('Erro ao criar pedido: ' + pedError.message);

      // 2.5 Inserir os Itens do Pedido
      const orderItems = cart.map((item) => ({
        pedido_id: pedData.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
      }));

      const { error: itemsError } = await supabase
        .from('itens_pedido')
        .insert(orderItems);

      if (itemsError) throw new Error('Erro ao salvar itens do pedido: ' + itemsError.message);

      // 3. Chamar a Edge Function para gerar a Preference do MP
      const itemsForMP = cart.map((item) => ({
        id: item.id.toString(),
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco
      }));

      // Adiciona o valor do frete como um item na cobrança do Mercado Pago
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
          external_reference: pedData.id.toString()
        })
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        throw new Error('Erro ao gerar preferência de pagamento: ' + (mpData.error || 'Erro desconhecido'));
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
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium text-gray-600">{item.quantidade}x</span>
                      <span className="text-gray-900 line-clamp-1">{item.nome}</span>
                    </div>
                    <span className="text-gray-900 font-medium">
                      R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span>{selectedShipping ? `R$ ${Number(selectedShipping.price).toFixed(2).replace('.', ',')}` : 'A calcular'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>R$ {(cartTotal + (selectedShipping ? Number(selectedShipping.price) : 0)).toFixed(2).replace('.', ',')}</span>
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
                <div className="mt-4 border-t border-gray-100 pt-6">
                  <p className="text-sm text-center text-gray-600 mb-4">Escolha como deseja pagar de forma 100% segura pelo Mercado Pago:</p>
                  <Wallet
                    initialization={{ preferenceId: preferenceId }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

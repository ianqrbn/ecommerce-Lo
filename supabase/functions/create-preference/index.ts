import { MercadoPagoConfig, Preference } from 'npm:mercadopago';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { items, payer, external_reference, coupon_code, credito_aplicado = 0 } = await req.json();

    const client = new MercadoPagoConfig({ 
      accessToken: Deno.env.get('MP_ACCESS_TOKEN') || '',
    });

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let discountAmount = 0;

    // Se houver cupom, validamos no backend
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('cupons')
        .select('*')
        .eq('codigo', coupon_code)
        .eq('ativo', true)
        .single();
        
      if (!couponError && coupon) {
         // O desconto é aplicado apenas sobre os produtos (subtotal)
         const subtotal = items.filter((i: any) => i.id !== 'frete').reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);
         
         if (coupon.tipo === 'porcentagem') {
            discountAmount = subtotal * (coupon.valor / 100);
         } else {
            discountAmount = coupon.valor;
         }
         discountAmount = Math.min(discountAmount, subtotal);
      }
    }

    const subtotal = items.filter((i: any) => i.id !== 'frete').reduce((acc: number, item: any) => acc + (item.unit_price * item.quantity), 0);

    const mpItems = items.map((item: any) => {
      if (item.id === 'frete' || discountAmount === 0 || subtotal === 0) {
        return {
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          currency_id: 'BRL',
        };
      }
      
      const itemTotal = item.unit_price * item.quantity;
      const proportion = itemTotal / subtotal;
      const itemDiscount = discountAmount * proportion;
      const newItemTotal = itemTotal - itemDiscount;
      
      // Ajusta o preço unitário para refletir o desconto (limitado a 2 casas decimais)
      const newUnitPrice = parseFloat((newItemTotal / item.quantity).toFixed(2));
      
      return {
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: newUnitPrice,
          currency_id: 'BRL',
      };
    });

    const preference = new Preference(client);

    const totalMp = mpItems.reduce((acc: number, cur: any) => acc + (cur.unit_price * cur.quantity), 0);
    const finalTotal = totalMp - credito_aplicado;

    // Se o pedido for 100% pago com crédito, aprovamos direto
    if (finalTotal <= 0) {
      // 1. Descontar o saldo do usuário
      const { data: pedData, error: pedErr } = await supabaseAdmin
        .from('pedidos')
        .select('enderecos!inner(usuario_id)')
        .eq('id', external_reference)
        .single();
        
      if (!pedErr && pedData) {
        const usuarioId = (pedData.enderecos as any).usuario_id;
        
        // Registrar a transacao
        await supabaseAdmin.from('transacoes_credito').insert([{
          usuario_id: usuarioId,
          pedido_id: parseInt(external_reference),
          valor: credito_aplicado,
          tipo: 'saida',
          descricao: `Pagamento integral do pedido #${external_reference} com crédito`
        }]);

        // Deduzir o saldo
        const { data: uData } = await supabaseAdmin.from('usuarios').select('credito_loja').eq('id', usuarioId).single();
        if (uData) {
          const novoSaldo = Math.max(0, Number(uData.credito_loja || 0) - credito_aplicado);
          await supabaseAdmin.from('usuarios').update({ credito_loja: novoSaldo }).eq('id', usuarioId);
        }
      }

      // 2. Atualizar status do pedido
      await supabaseAdmin.from('pedidos').update({
        status: 'pago',
        forma_pagamento: 'credito_loja'
      }).eq('id', external_reference);

      return new Response(JSON.stringify({ paid_with_credit: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Se o credito aplicado for parcial mas não zerou, aplicamos um desconto proporcional (ou item de desconto negativo)
    // O MP aceita valores unitários, então a forma correta seria diminuir o credito do total.
    // Uma forma de abater crédito no MP sem dar erro de "item price cannot be negative":
    // O ideal seria repassar o crédito rateado nos itens, assim como fizemos com o cupom, mas para evitar complexidade e bugs de rounding,
    // usaremos o mesmo rateio do cupom, ou seja, somamos cupom_discount + credito_aplicado rateados nos itens.
    
    // (Por hora, simplificando: se o cara marcou usar crédito, o mpItems teria que sofrer mais um desconto rateado de `credito_aplicado`)
    // Refazendo o rateio se credito_aplicado > 0:
    if (credito_aplicado > 0) {
       for (let i = 0; i < mpItems.length; i++) {
         const itemTotal = mpItems[i].unit_price * mpItems[i].quantity;
         const proportion = itemTotal / totalMp;
         const descCred = credito_aplicado * proportion;
         const nTotal = itemTotal - descCred;
         mpItems[i].unit_price = parseFloat((nTotal / mpItems[i].quantity).toFixed(2));
       }
    }

    const body = {
      items: mpItems,
      payer: payer,
      external_reference: external_reference,
      notification_url: 'https://gbwodbrshgctsqdvmaou.supabase.co/functions/v1/mercadopago-webhook',
      back_urls: {
        success: 'https://meu-ecommerce-teste.com/perfil',
        failure: 'https://meu-ecommerce-teste.com/checkout',
        pending: 'https://meu-ecommerce-teste.com/checkout'
      },
      auto_return: 'approved',
    };

    const response = await preference.create({ body });

    return new Response(JSON.stringify({ preferenceId: response.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error creating preference:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

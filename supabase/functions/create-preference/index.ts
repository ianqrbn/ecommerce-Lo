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
    const { items, payer, external_reference, coupon_code } = await req.json();

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

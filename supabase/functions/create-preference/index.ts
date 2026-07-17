import { MercadoPagoConfig, Preference } from 'npm:mercadopago';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { items, payer, external_reference } = await req.json();

    const client = new MercadoPagoConfig({ 
      accessToken: Deno.env.get('MP_ACCESS_TOKEN') || '',
    });

    const preference = new Preference(client);

    const body = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        currency_id: 'BRL',
      })),
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
  } catch (error) {
    console.error("Error creating preference:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

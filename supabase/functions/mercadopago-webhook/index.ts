import { createClient } from 'jsr:@supabase/supabase-js@2'
import { MercadoPagoConfig, Payment } from 'npm:mercadopago';

Deno.serve(async (req) => {
  // O Mercado Pago exige retornar HTTP 200/201 rapidamente. 
  try {
    let paymentId: string | null = null;
    
    // 1. O MP pode mandar os dados via Query Params (topic/id)
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    if (topic === "payment") {
      paymentId = url.searchParams.get("id") || url.searchParams.get("data.id");
    }

    // 2. O MP também pode mandar via Body JSON
    if (!paymentId) {
      try {
        const body = await req.json();
        if (body.type === "payment" || body.action?.startsWith("payment")) {
          paymentId = body.data?.id;
        }
      } catch (e) {
        // Ignora caso não tenha body JSON
      }
    }

    if (!paymentId) {
      return new Response("Not a payment event", { status: 200 });
    }

    // Inicializa o Mercado Pago SDK
    const client = new MercadoPagoConfig({ 
      accessToken: Deno.env.get('MP_ACCESS_TOKEN') || '',
    });
    const paymentClient = new Payment(client);
    
    // Busca os dados do pagamento no Mercado Pago para garantir a veracidade
    const paymentData = await paymentClient.get({ id: paymentId });
    
    const status = paymentData.status; // ex: 'approved', 'rejected', 'pending'
    const externalReference = paymentData.external_reference; // ID do Pedido que passamos

    if (externalReference) {
      // Inicializa o Supabase com privilégios de Admin (Bypass RLS)
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Atualiza a tabela pagamentos
      await supabase
        .from('pagamentos')
        .update({ status_pagamento: status })
        .eq('pedido_id', externalReference);

      // Se foi aprovado, atualiza o pedido e gera a etiqueta
      if (status === 'approved') {
        await supabase
          .from('pedidos')
          .update({ status: 'pago' })
          .eq('id', externalReference);

        // Chama a Edge Function para gerar a etiqueta assincronamente (sem aguardar)
        fetch(`${supabaseUrl}/functions/v1/generate-shipping-label`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}` // Service Role
          },
          body: JSON.stringify({ pedido_id: externalReference })
        }).catch(err => console.error('Falha ao disparar geração de etiqueta:', err));
      }
    }

    // Responde com sucesso
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Erro no Webhook:", error);
    // Mesmo com erro interno, retorna 200 para o MP não ficar re-tentando eternamente
    return new Response("OK", { status: 200 });
  }
});

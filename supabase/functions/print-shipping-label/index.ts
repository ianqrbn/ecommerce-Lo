import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id_me } = await req.json() // Passa o melhor_envio_id

    if (!order_id_me) {
      throw new Error('ID do pedido no Melhor Envio é obrigatório')
    }

    const token = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!token) throw new Error('Token do Melhor Envio não configurado')

    const isProduction = false;
    const meApiUrl = isProduction ? 'https://melhorenvio.com.br/api/v2' : 'https://sandbox.melhorenvio.com.br/api/v2';
    
    const meHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Ecommerce Lo (ecommerce@lo.com.br)'
    }

    // A impressão devolve um link de PDF
    const printPayload = {
      mode: 'public', // Retorna URL pública do PDF
      orders: [order_id_me]
    }

    const response = await fetch(`${meApiUrl}/me/shipment/print`, {
      method: 'POST',
      headers: meHeaders,
      body: JSON.stringify(printPayload)
    })

    const printData = await response.json()

    if (!response.ok) {
      throw new Error(`Erro ao imprimir: ${JSON.stringify(printData)}`)
    }

    // Atualiza banco via Service Role para bypass no RLS do frontend
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    await supabase.from('pedidos').update({ etiqueta_status: 'impressa' }).eq('melhor_envio_id', order_id_me)

    // Retorna a URL do PDF (a chave exata depende do retorno oficial)
    return new Response(JSON.stringify(printData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

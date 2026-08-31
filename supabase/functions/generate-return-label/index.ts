import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

    let devolucao_id: string | null = null;
  try {
    const reqBody = await req.json()
    devolucao_id = reqBody.devolucao_id;

    if (!devolucao_id) {
      throw new Error('devolucao_id é obrigatório')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!token) throw new Error('Token do Melhor Envio não configurado')

    const isProduction = false; // Mude para true quando for prod
    const meApiUrl = isProduction ? 'https://melhorenvio.com.br/api/v2' : 'https://sandbox.melhorenvio.com.br/api/v2';

    const meHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Ecommerce Lo (ecommerce@lo.com.br)'
    }

    // 1. Buscar detalhes da devolução e do pedido
    const { data: devolucao, error: devError } = await supabase
      .from('devolucoes')
      .select('*, pedidos(*, enderecos(*, usuarios(nome, email, cpf, telefone)))')
      .eq('id', devolucao_id)
      .single()

    if (devError || !devolucao) throw new Error('Devolução não encontrada')
    const pedido = devolucao.pedidos;
    const pedido_id = pedido.id;

    // Se já gerada, abortar
    if (devolucao.status === 'etiqueta_gerada' || devolucao.status === 'gerando') {
      return new Response(JSON.stringify({ message: 'Etiqueta já processada ou em processamento' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Trava de condição de corrida (Race condition lock)
    await supabase.from('devolucoes').update({ status: 'gerando' }).eq('id', devolucao_id);

    // Buscar itens do pedido
    const { data: itens } = await supabase
      .from('itens_pedido')
      .select(`
        *,
        produtos (nome, preco, peso_prata)
      `)
      .eq('pedido_id', pedido_id)

    // Formatar produtos
    let totalWeightGrams = 0
    let totalQuantity = 0
    const productsForME = itens?.map((item: any) => {
      totalQuantity += item.quantidade
      totalWeightGrams += (Number(item.produtos.peso_prata || 0) * item.quantidade)
      return {
        name: item.produtos.nome,
        quantity: item.quantidade,
        unitary_value: item.preco_unitario
      }
    }) || []

    let weightKg = (totalWeightGrams / 1000) + 0.100 // Caixa
    if (weightKg < 0.3) weightKg = 0.3

    // 2. Adicionar ao Carrinho (Cart)
    const cartPayload = {
      service: pedido.melhor_envio_service_id || 1, // ID salvo no momento do checkout
      from: {
        name: pedido.enderecos?.usuarios?.nome || 'Cliente',
        phone: pedido.enderecos?.usuarios?.telefone || '11999999999',
        email: pedido.enderecos?.usuarios?.email || 'cliente@email.com',
        document: pedido.enderecos?.usuarios?.cpf || '85581338914',
        address: pedido.enderecos?.rua || '',
        complement: pedido.enderecos?.complemento || '',
        number: pedido.enderecos?.numero || '',
        district: pedido.enderecos?.bairro || '',
        city: pedido.enderecos?.cidade || '',
        postal_code: pedido.enderecos?.cep.replace(/\D/g, '') || '',
        state_abbr: pedido.enderecos?.estado || ''
      },
      to: {
        name: 'Erro Silver',
        phone: '11999999999',
        email: 'errosilver@gmail.com',
        document: '12345678909',
        address: 'Rua Origem',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        postal_code: '01001000',
        state_abbr: 'SP'
      },
      products: productsForME,
      volumes: [{
        height: Math.ceil(totalQuantity / 5) * 4,
        width: 11,
        length: 16,
        weight: Number(weightKg.toFixed(2))
      }],
      options: {
        insurance_value: pedido.subtotal,
        receipt: false,
        own_hand: false,
        non_commercial: true
      }
    }

    const cartResponse = await fetch(`${meApiUrl}/me/cart`, {
      method: 'POST',
      headers: meHeaders,
      body: JSON.stringify(cartPayload)
    })

    const cartData = await cartResponse.json()
    if (!cartResponse.ok) {
      throw new Error(`Erro ao adicionar ao carrinho: ${JSON.stringify(cartData)}`)
    }

    const orderIdME = cartData.id // ID da etiqueta no carrinho

    // 3. Checkout (Pagar Etiqueta com o saldo)
    const checkoutResponse = await fetch(`${meApiUrl}/me/shipment/checkout`, {
      method: 'POST',
      headers: meHeaders,
      body: JSON.stringify({ orders: [orderIdME] })
    })

    const checkoutData = await checkoutResponse.json()

    if (!checkoutResponse.ok) {
      // Falha de checkout (provavelmente saldo)
      await supabase.from('pedidos').update({ etiqueta_status: 'erro_saldo' }).eq('id', pedido_id)
      throw new Error(`Erro no checkout (Saldo?): ${JSON.stringify(checkoutData)}`)
    }

    // 4. Generate (Gerar Rastreio)
    const generateResponse = await fetch(`${meApiUrl}/me/shipment/generate`, {
      method: 'POST',
      headers: meHeaders,
      body: JSON.stringify({ orders: [orderIdME] })
    })

    const generateData = await generateResponse.json()

    if (!generateResponse.ok) {
      throw new Error(`Erro ao gerar etiqueta: ${JSON.stringify(generateData)}`)
    }

    // Aqui precisariamos consultar o tracking real da etiqueta gerada, ou parsear a resposta
    // Por simplicidade do exemplo e limites da API sandbox, as vezes o tracking demora uns segundos,
    // mas a API geralmente retorna o tracking code dentro dos dados ou via endpoint /tracking.
    // Vamos fazer um update básico:
    let trackingCode = 'GERADO_AGUARDANDO'

    // Atualiza o banco
    await supabase.from('devolucoes').update({
      status: 'etiqueta_gerada',
      rastreio: trackingCode,
      etiqueta_url: `https://melhorenvio.com.br/painel/imprimir/${orderIdME}`
    }).eq('id', devolucao_id)

    return new Response(JSON.stringify({ success: true, melhor_envio_id: orderIdME }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro:', error)

    // Se falhar e a gente tiver o devolucao_id no escopo, volta o status para 'pendente'
    if (devolucao_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase.from('devolucoes').update({ status: 'pendente' }).eq('id', devolucao_id);
      } catch (e) { }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})

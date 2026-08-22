import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let pedido_id: number | null = null;
  try {
    const reqBody = await req.json()
    pedido_id = reqBody.pedido_id;

    if (!pedido_id) {
      throw new Error('pedido_id é obrigatório')
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

    // 1. Buscar detalhes do pedido
    const { data: pedido, error: pedError } = await supabase
      .from('pedidos')
      .select(`
        *,
        enderecos (
          *,
          usuarios (nome, email, cpf, telefone)
        )
      `)
      .eq('id', pedido_id)
      .single()

    if (pedError || !pedido) throw new Error('Pedido não encontrado')

    // Se já gerada ou já está sendo gerada por outro processo, abortar
    if (pedido.etiqueta_status === 'gerada' || pedido.etiqueta_status === 'gerando') {
      return new Response(JSON.stringify({ message: 'Etiqueta já processada ou em processamento', rastreio: pedido.rastreio_codigo }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Trava de condição de corrida (Race condition lock)
    // Atualiza imediatamente para 'gerando' para que outras execuções simultâneas ignorem
    await supabase.from('pedidos').update({ etiqueta_status: 'gerando' }).eq('id', pedido_id);

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
        name: 'Erro Silver',
        phone: '11999999999',
        email: 'errosilver@gmail.com',
        document: '12345678909', // CPF/CNPJ válido necessário
        address: 'Rua Origem',
        number: '123',
        district: 'Centro',
        city: 'São Paulo',
        postal_code: '01001000',
        state_abbr: 'SP'
      },
      to: {
        name: pedido.enderecos?.usuarios?.nome || 'Cliente',
        phone: pedido.enderecos?.usuarios?.telefone || '11999999999',
        email: pedido.enderecos?.usuarios?.email || 'cliente@email.com',
        document: pedido.enderecos?.usuarios?.cpf || '85581338914', // Mock CPF se não tiver
        address: pedido.enderecos?.rua || '',
        complement: pedido.enderecos?.complemento || '',
        number: pedido.enderecos?.numero || '',
        district: pedido.enderecos?.bairro || '',
        city: pedido.enderecos?.cidade || '',
        postal_code: pedido.enderecos?.cep.replace(/\D/g, '') || '',
        state_abbr: pedido.enderecos?.estado || ''
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
    await supabase.from('pedidos').update({
      etiqueta_status: 'gerada',
      melhor_envio_id: orderIdME,
      rastreio_codigo: trackingCode
    }).eq('id', pedido_id)

    return new Response(JSON.stringify({ success: true, melhor_envio_id: orderIdME }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro:', error)

    // Se falhar e a gente tiver o pedido_id no escopo, volta o status para 'erro_saldo'
    if (pedido_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase.from('pedidos').update({ etiqueta_status: 'erro_saldo' }).eq('id', pedido_id);
      } catch (e) { }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})

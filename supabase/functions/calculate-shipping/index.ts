import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cep_destino, items } = await req.json()

    if (!cep_destino || !items || items.length === 0) {
      throw new Error('CEP de destino e itens são obrigatórios')
    }

    // Inicializa o cliente do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    let totalWeightGrams = 0
    let totalQuantity = 0
    let cepOrigem = '35680392' // Default fallback

    // Buscar CEP de Origem nas configurações
    const { data: configData } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'cep_origem')
      .single()
      
    if (configData && configData.valor) {
      cepOrigem = configData.valor
    }

    // Buscar pesos dos produtos
    for (const item of items) {
      const { data, error } = await supabase
        .from('produtos')
        .select('peso_prata')
        .eq('id', item.id)
        .single()
      
      if (error) {
        console.error(`Erro ao buscar produto ${item.id}:`, error)
        continue
      }
      
      totalQuantity += item.quantity || 1;
      if (data && data.peso_prata) {
        totalWeightGrams += (Number(data.peso_prata) * (item.quantity || 1))
      }
    }

    // Calcula dimensões baseadas na quantidade (a cada 5 produtos, aumenta a altura em 4cm)
    const baseLength = 16
    const baseWidth = 11
    let height = Math.ceil(totalQuantity / 5) * 4
    // Altura máxima da caixa dos correios costuma ser uns 30cm, vamos limitar se necessário, mas 4cm por 5 itens é seguro
    
    // Calcula peso em KG. 
    // É necessário adicionar peso da caixa sim, porque transportadoras cobram pelo peso real e têm peso mínimo (ex: 0.3kg = 300g). 
    // Se a joia pesa 5g, e passarmos 0.005kg, a API do Melhor Envio pode recusar. 
    // Vamos garantir no mínimo 0.3kg para o pacote.
    let weightKg = (totalWeightGrams / 1000) + 0.100 // + 100g da caixa de papelão
    if (weightKg < 0.3) {
      weightKg = 0.3
    }

    const payload = {
      from: {
        postal_code: cepOrigem
      },
      to: {
        postal_code: cep_destino.replace(/\D/g, '')
      },
      package: {
        height: height,
        width: baseWidth,
        length: baseLength,
        weight: Number(weightKg.toFixed(2))
      }
    }

    const token = Deno.env.get('MELHOR_ENVIO_TOKEN')
    if (!token) {
      throw new Error('Token do Melhor Envio não configurado')
    }

    // Vamos usar a URL de sandbox temporariamente, pois muitos tokens recém-gerados são de sandbox.
    // Se o seu token for de produção, troque para: https://melhorenvio.com.br/api/v2/me/shipment/calculate
    const apiUrl = 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Ecommerce Lo (contato@ecommerce-lo.com)' // Recomendado pela API
      },
      body: JSON.stringify(payload)
    })

    const shippingData = await response.json()

    if (!response.ok) {
      console.error('Erro na API Melhor Envio (Status ' + response.status + '):', shippingData)
      throw new Error(`Erro Melhor Envio: ${JSON.stringify(shippingData)}`)
    }

    // Filtra transportadoras que retornaram erro (as que não atendem a região)
    const availableOptions = shippingData.filter((option: any) => !option.error)

    // Formata o retorno para o frontend
    const formattedOptions = availableOptions.map((option: any) => ({
      id: option.id,
      name: option.name,
      company: option.company.name,
      price: option.price,
      delivery_time: option.delivery_time,
      picture: option.company.picture
    }))

    return new Response(JSON.stringify(formattedOptions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro interno:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

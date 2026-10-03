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
    const { pedido_id, tipo } = await req.json()

    if (!pedido_id) {
      throw new Error('pedido_id é obrigatório')
    }

    if (!tipo || !['pagamento_confirmado', 'pedido_entregue', 'pedido_enviado'].includes(tipo)) {
      throw new Error("tipo inválido. Deve ser 'pagamento_confirmado', 'pedido_entregue' ou 'pedido_enviado'")
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Buscar detalhes completos do pedido, itens e comprador
    const { data: pedido, error: pedError } = await supabase
      .from('pedidos')
      .select(`
        *,
        enderecos (
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cep,
          usuarios (
            nome,
            email
          )
        ),
        itens_pedido (
          quantidade,
          preco_unitario,
          tamanho,
          produtos (
            nome,
            imagem_principal
          )
        )
      `)
      .eq('id', pedido_id)
      .single()

    if (pedError || !pedido) {
      throw new Error(`Pedido #${pedido_id} não encontrado: ${pedError?.message}`)
    }

    // Identificação do cliente
    const clienteEmail = pedido.enderecos?.usuarios?.email
    const clienteNome = pedido.enderecos?.usuarios?.nome || 'Cliente'

    if (!clienteEmail) {
      // Se não tiver e-mail do cliente (ex: venda de balcão sem cadastro de e-mail), apenas encerra sem erro
      return new Response(JSON.stringify({ 
        message: 'Pedido não possui e-mail de cliente associado para envio.', 
        pedido_id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'ERRO SILVER <onboarding@resend.dev>'

    // 2. Montagem dos templates HTML de acordo com o tipo
    let subject = ''
    let htmlContent = ''

    const formatCurrency = (val: number) => `R$ ${Number(val || 0).toFixed(2).replace('.', ',')}`

    // Template 1: PAGAMENTO CONFIRMADO
    if (tipo === 'pagamento_confirmado') {
      subject = `Pagamento Confirmado - Pedido #${pedido.id} | ERRO SILVER`

      const itensHtml = (pedido.itens_pedido || []).map((item: any) => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 12px 0;">
            <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${item.produtos?.nome || 'Joia em Prata'}</div>
            ${item.tamanho ? `<div style="font-size: 12px; color: #581c2d; font-weight: 500;">Tamanho: ${item.tamanho}</div>` : ''}
            <div style="font-size: 12px; color: #6b7280;">Qtd: ${item.quantidade}x ${formatCurrency(item.preco_unitario)}</div>
          </td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1f2937; font-size: 14px;">
            ${formatCurrency(Number(item.preco_unitario || 0) * Number(item.quantidade || 1))}
          </td>
        </tr>
      `).join('')

      const endereco = pedido.enderecos
      const enderecoFormatado = endereco 
        ? `${endereco.rua}, ${endereco.numero || 'S/N'}${endereco.complemento ? ` (${endereco.complemento})` : ''} - ${endereco.bairro}, ${endereco.cidade}/${endereco.estado} - CEP: ${endereco.cep || ''}`
        : 'Endereço registrado na conta'

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; color: #333333;">
          <div style="background-color: #581c2d; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 2px;">ERRO SILVER</h1>
            <p style="color: #ffffff; margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Pagamento Confirmado</p>
          </div>

          <div style="padding: 32px 24px;">
            <h2 style="font-size: 18px; color: #1f2937; margin-top: 0;">Olá, ${clienteNome}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
              Excelente notícia! Seu pagamento para o pedido <strong>#${pedido.id}</strong> foi aprovado com sucesso.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
              Já estamos preparando suas joias com todo carinho e cuidado para o envio.
            </p>

            <div style="margin: 28px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; padding: 16px 0;">
              <h3 style="font-size: 15px; color: #1f2937; margin: 0 0 12px 0;">Resumo da sua compra:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  ${itensHtml}
                </tbody>
              </table>

              <div style="margin-top: 16px; border-top: 1px dashed #e5e7eb; padding-top: 12px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #6b7280;">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(pedido.subtotal)}</span>
                </div>
                ${pedido.desconto_aplicado > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #059669;">
                    <span>Desconto:</span>
                    <span>- ${formatCurrency(pedido.desconto_aplicado)}</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #6b7280;">
                  <span>Frete:</span>
                  <span>${pedido.frete > 0 ? formatCurrency(pedido.frete) : 'Grátis'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 16px; font-weight: bold; color: #581c2d;">
                  <span>Total Pago:</span>
                  <span>${formatCurrency(pedido.total)}</span>
                </div>
              </div>
            </div>

            <div style="background-color: #fdf8f9; border-left: 4px solid #581c2d; padding: 14px 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #581c2d;">Endereço de Entrega:</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #4b5563;">${enderecoFormatado}</p>
            </div>

            <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
              Assim que o seu pacote for postado, nós enviaremos um novo e-mail contendo o seu código de rastreamento para você acompanhar a entrega em tempo real.
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f0f0f0; font-size: 12px; color: #9ca3af;">
            ERRO SILVER — Feito com afeto e sofisticação.
          </div>
        </div>
      `
    }

    // Template 2: PEDIDO ENTREGUE & AGRADECIMENTO
    if (tipo === 'pedido_entregue') {
      subject = `Sua joia chegou! ✨ Pedido #${pedido.id} | ERRO SILVER`

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; color: #333333;">
          <div style="background-color: #581c2d; padding: 28px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 2px;">ERRO SILVER</h1>
            <p style="color: #fde8ec; margin: 6px 0 0 0; font-size: 14px;">Seu pedido foi entregue!</p>
          </div>

          <div style="padding: 32px 24px;">
            <h2 style="font-size: 18px; color: #1f2937; margin-top: 0;">Olá, ${clienteNome}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
              Consta em nosso sistema que o seu pedido <strong>#${pedido.id}</strong> foi entregue. Esperamos sinceramente que você se apaixone por cada detalhe da sua nova joia!
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
              Queremos agradecer profundamente por confiar em nosso trabalho e fazer parte da nossa história.
            </p>

            <div style="background-color: #faf5f6; border: 1px solid #f3d5dc; border-radius: 8px; padding: 20px; margin: 28px 0;">
              <h3 style="font-size: 15px; color: #581c2d; margin: 0 0 10px 0; font-weight: 600;">
                ✨ Dicas de Cuidados com a sua Prata:
              </h3>
              <ul style="font-size: 13px; line-height: 1.8; color: #4b5563; margin: 0; padding-left: 20px;">
                <li><strong>Cosméticos:</strong> Aplique perfumes, hidratantes e protetor solar alguns minutos antes de colocar a sua joia.</li>
                <li><strong>Evite umidade:</strong> Retire suas peças ao tomar banho, entrar na piscina ou no mar.</li>
                <li><strong>Armazenamento:</strong> Guarde sua peça individualmente em local seco e arejado para evitar riscos e atritos.</li>
                <li><strong>Brilho eterno:</strong> Para recuperar o brilho natural da prata a qualquer momento, utilize uma flanela mágica de limpeza suave.</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0 20px 0;">
              <p style="font-size: 14px; font-weight: 500; color: #1f2937; margin-bottom: 12px;">
                Adoramos ver nossas peças brilhando com você!
              </p>
              <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
                Tire uma foto, publique no Instagram e marque nosso perfil <strong>@errosilver</strong> para aparecer nos nossos destaques.
              </p>
            </div>
          </div>

          <div style="background-color: #f9fafb; padding: 18px; text-align: center; border-top: 1px solid #f0f0f0; font-size: 12px; color: #9ca3af;">
            ERRO SILVER — Agradecemos por sua preferência. Até a próxima!
          </div>
        </div>
      `
    }

    // Template 3: PEDIDO ENVIADO
    if (tipo === 'pedido_enviado') {
      subject = `Sua joia está a caminho! 🚚 Pedido #${pedido.id} | ERRO SILVER`
      const rastreio = pedido.rastreio_codigo || 'Disponível em breve'

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; color: #333333;">
          <div style="background-color: #581c2d; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 2px;">ERRO SILVER</h1>
            <p style="color: #ffffff; margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Pedido a Caminho</p>
          </div>

          <div style="padding: 32px 24px;">
            <h2 style="font-size: 18px; color: #1f2937; margin-top: 0;">Olá, ${clienteNome}!</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
              O seu pedido <strong>#${pedido.id}</strong> foi despachado e já está a caminho do seu endereço!
            </p>

            <div style="background-color: #fdf2f4; border-left: 4px solid #581c2d; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #581c2d;">Código de Rastreamento:</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-family: monospace; color: #1f2937; font-weight: bold;">${rastreio}</p>
            </div>

            <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
              Você também pode acompanhar o andamento da entrega através da aba <strong>Meus Pedidos</strong> no seu perfil em nosso site.
            </p>
          </div>

          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f0f0f0; font-size: 12px; color: #9ca3af;">
            ERRO SILVER — Elegância em cada detalhe.
          </div>
        </div>
      `
    }

    // 3. Envio seguro com Resend
    if (!resendApiKey) {
      console.warn('[send-order-email] RESEND_API_KEY não configurada. Simulação de envio:')
      console.log(`Para: ${clienteEmail} | Assunto: ${subject}`)
      return new Response(JSON.stringify({
        success: true,
        simulated: true,
        destinatario: clienteEmail,
        tipo,
        message: 'E-mail preparado com sucesso. Para envio real, configure RESEND_API_KEY no Supabase.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clienteEmail],
        subject: subject,
        html: htmlContent
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('[send-order-email] Erro na API do Resend:', resendData)
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro no Resend: ' + (resendData.message || JSON.stringify(resendData))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    return new Response(JSON.stringify({ success: true, resendId: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err: any) {
    console.error('[send-order-email] Erro:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})

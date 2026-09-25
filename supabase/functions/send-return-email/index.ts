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
    const { devolucao_id } = await req.json()

    if (!devolucao_id) {
      throw new Error('devolucao_id é obrigatório')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Buscar detalhes da devolução, pedido e cliente
    const { data: devolucao, error: devError } = await supabase
      .from('devolucoes')
      .select('*, pedidos(*, enderecos(*, usuarios(nome, email)))')
      .eq('id', devolucao_id)
      .single()

    if (devError || !devolucao) {
      throw new Error('Devolução não encontrada')
    }

    const pedido = devolucao.pedidos
    const clienteNome = pedido?.enderecos?.usuarios?.nome || 'Cliente'
    const clienteEmail = pedido?.enderecos?.usuarios?.email

    if (!clienteEmail) {
      throw new Error('E-mail do cliente não encontrado')
    }

    const etiquetaUrl = devolucao.etiqueta_url || '#'
    const rastreio = devolucao.rastreio || 'Aguardando'
    const pedidoId = pedido?.id || devolucao.pedido_id

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'ERRO SILVER <onboarding@resend.dev>'

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; color: #333333;">
        <div style="background-color: #581c2d; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 1px;">ERRO SILVER</h1>
          <p style="color: #e5c5cb; margin: 4px 0 0 0; font-size: 13px;">Autorização de Devolução</p>
        </div>

        <div style="padding: 32px 24px;">
          <h2 style="font-size: 18px; color: #1f2937; margin-top: 0;">Olá, ${clienteNome}!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
            Sua solicitação de devolução para o pedido <strong>#${pedidoId}</strong> foi autorizada.
            Abaixo estão as orientações e a etiqueta de envio para que você realize a postagem do produto sem nenhum custo.
          </p>

          <div style="background-color: #fdf2f4; border-left: 4px solid #581c2d; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #581c2d;">Código de Rastreio / Autorização:</p>
            <p style="margin: 4px 0 0 0; font-size: 16px; font-family: monospace; color: #1f2937; font-weight: bold;">${rastreio}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${etiquetaUrl}" target="_blank" style="background-color: #581c2d; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">
              Imprimir Etiqueta de Envio
            </a>
            <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">(A etiqueta também pode ser acessada nos detalhes do pedido em nosso site)</p>
          </div>

          <h3 style="font-size: 16px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 28px;">
            Orientações para o Envio:
          </h3>
          <ol style="font-size: 14px; line-height: 1.8; color: #4b5563; padding-left: 20px;">
            <li><strong>Embalagem:</strong> Acondicione a joia em sua caixinha original ou caixa com boa proteção para evitar danos no transporte.</li>
            <li><strong>Etiqueta:</strong> Imprima a etiqueta gerada juntamente com a declaração de conteúdo em uma folha A4 e cole na parte externa do pacote.</li>
            <li><strong>Postagem:</strong> Leve o pacote a qualquer agência autorizada (Correios ou ponto de coleta indicado na etiqueta). O frete já está pago por nós.</li>
            <li><strong>Liberação do Crédito:</strong> Assim que o pacote chegar à nossa loja e passar pela rápida conferência das peças, o crédito integral será liberado em sua carteira da loja para novas compras.</li>
          </ol>

          <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
            Para mais dúvidas sobre o processo, consulte nossa página de <a href="https://lojoias.com.br/devolucoes" style="color: #581c2d; font-weight: 500;">Orientações de Devolução</a>.
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #f0f0f0; font-size: 12px; color: #9ca3af;">
          ERRO SILVER — Elegância e Confiança em cada detalhe.
        </div>
      </div>
    `

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY não configurada. E-mail simulado com sucesso.')
      return new Response(JSON.stringify({
        success: true,
        simulated: true,
        message: 'RESEND_API_KEY não configurada no Supabase Secrets. O e-mail foi preparado, mas precisa da chave para envio real.',
        destinatario: clienteEmail,
        etiqueta_url: etiquetaUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    // 2. Envio via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [clienteEmail],
        subject: `Etiqueta de Devolução - Pedido #${pedidoId} | Lo Jóias`,
        html: htmlContent
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Erro na API do Resend:', resendData)
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
    console.error('Erro ao enviar e-mail de devolução:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})

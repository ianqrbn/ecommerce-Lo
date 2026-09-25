import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';
import { Link } from 'react-router-dom';
import {
  RotateCcw,
  Mail,
  Package,
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function Devolucoes() {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Cabeçalho da Página */}
        <div className="text-center max-w-2xl mx-auto mb-12">

          <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 font-semibold tracking-tight">
            Política de Trocas & Devoluções
          </h1>
          <p className="mt-3 text-base text-gray-600">
            Prezamos pela sua total satisfação e transparência. Conheça as diretrizes, prazos e o passo a passo para realizar sua devolução com rapidez e sem custos.
          </p>
        </div>

        {/* Linha do Tempo / Etapas do Processo */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-10">
          <h2 className="text-xl font-serif text-gray-900 font-semibold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-vinho-700" />
            Como funciona o processo de devolução?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            {/* Etapa 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-vinho-100/80 text-vinho-800 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Solicitação</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Acesse a aba <strong>Meus Pedidos</strong> no seu perfil e solicite a devolução informando o motivo.
              </p>
            </div>

            {/* Etapa 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-vinho-100/80 text-vinho-800 flex items-center justify-center font-bold text-sm mb-3">
                <Mail className="w-5 h-5 text-vinho-800" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Etiqueta por E-mail</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Após aprovação da loja, a etiqueta com código de postagem é <strong>enviada para o seu e-mail cadastrado</strong> e fica disponível no seu perfil.
              </p>
            </div>

            {/* Etapa 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-vinho-100/80 text-vinho-800 flex items-center justify-center font-bold text-sm mb-3">
                <Package className="w-5 h-5 text-vinho-800" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Envio Gratuito</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Imprima a etiqueta, embale o produto com cuidado e poste em uma agência sem pagar frete.
              </p>
            </div>

            {/* Etapa 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-vinho-100/80 text-vinho-800 flex items-center justify-center font-bold text-sm mb-3">
                <ShieldCheck className="w-5 h-5 text-vinho-800" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Recebimento & Conferência</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Quando as peças chegarem à nossa loja física, faremos a rápida inspeção do estado dos produtos.
              </p>
            </div>

            {/* Etapa 5 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                <CreditCard className="w-5 h-5 text-emerald-800" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Crédito Liberado</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Com o produto em mãos e aprovado, o valor integral é creditado em sua carteira na loja para novas compras.
              </p>
            </div>
          </div>
        </div>

        {/* Guia Prático de Embalagem e Postagem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-serif text-gray-900 font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-vinho-700" />
              Instruções de Embalagem e Postagem
            </h2>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Embalagem segura:</strong> Utilize a embalagem original da joia ou uma caixa de papelão resistente com proteção interna (plástico bolha ou papel) para evitar qualquer impacto.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Impressão da Etiqueta:</strong> Imprima a etiqueta de envio gerada juntamente com a <em>Declaração de Conteúdo</em> em uma folha A4 comum, sem rasuras no código de barras.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Fixação externa:</strong> Cole a etiqueta na parte externa do pacote usando fita adesiva transparente. A declaração de conteúdo deve ser dobrada e afixada em envelope plástico transparente na parte externa da caixa.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Agência de Postagem:</strong> Dirija-se à agência dos Correios ou ponto de coleta indicado na etiqueta. <strong>Você não precisará pagar nada no balcão</strong>, pois o frete já foi pago pela loja.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h2 className="text-lg font-serif text-gray-900 font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-vinho-700" />
              Regras e Condições
            </h2>
            <ul className="space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-vinho-700 mt-2 shrink-0"></span>
                <span>
                  <strong>Prazo legal (CDC Art. 49):</strong> O prazo para solicitar a devolução é de até <strong>7 (sete) dias corridos</strong> após a data de recebimento do pedido no endereço de entrega.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-vinho-700 mt-2 shrink-0"></span>
                <span>
                  <strong>Condições do produto:</strong> As peças devem estar em perfeito estado, sem sinais de uso, manchas, ranhuras, odores ou alterações estruturais, acompanhadas de eventuais brindes e certificados.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-vinho-700 mt-2 shrink-0"></span>
                <span>
                  <strong>Transparência em caso de recusa:</strong> Caso uma solicitação seja recusada (por exemplo, por estar fora do prazo legal ou peças danificadas por mau uso), você poderá visualizar a justificativa completa diretamente no painel do seu pedido.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-vinho-700 mt-2 shrink-0"></span>
                <span>
                  <strong>Validade da etiqueta:</strong> As etiquetas possuem prazo de postagem definido pela transportadora. Recomendamos postar o pacote logo após a autorização para evitar o cancelamento da etiqueta.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card de Chamada para Ação */}
        <div className="bg-vinho-900 text-white rounded-2xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <h3 className="text-xl font-serif font-semibold text-white">Deseja solicitar uma devolução?</h3>
            <p className="text-sm text-vinho-200 mt-1 max-w-xl">
              Consulte seu histórico de compras para acompanhar seus pedidos, solicitar uma troca ou verificar o status da sua devolução em andamento.
            </p>
          </div>
          <Link
            to="/perfil"
            className="inline-flex items-center px-6 py-3 bg-white text-vinho-900 font-semibold text-sm rounded-lg hover:bg-vinho-50 transition-colors shrink-0 shadow-sm"
          >
            Acessar Meus Pedidos
          </Link>
        </div>
      </main>

      <Fuuter />
    </div>
  );
}

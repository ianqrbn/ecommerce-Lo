import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';

export default function FAQ() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Perguntas Frequentes (FAQ)</h1>
        <div className="space-y-6 text-gray-600">
           
           <div>
             <h3 className="font-medium text-gray-900 mb-2">Quais são as formas de pagamento aceitas?</h3>
             <p className="text-sm">Aceitamos cartões de crédito, boleto bancário e PIX.</p>
           </div>

           <div>
             <h3 className="font-medium text-gray-900 mb-2">Qual o prazo de entrega?</h3>
             <p className="text-sm">O prazo varia de acordo com o seu CEP e o método de envio escolhido. Você pode calcular o prazo no carrinho de compras.</p>
           </div>

           <div>
             <h3 className="font-medium text-gray-900 mb-2">Como acompanho meu pedido?</h3>
             <p className="text-sm">Acesse sua conta e vá na seção "Meus Pedidos" para ver o status e o código de rastreio.</p>
           </div>

        </div>
      </main>
      <Fuuter />
    </div>
  );
}

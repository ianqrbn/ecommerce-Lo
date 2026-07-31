import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';

export default function Envio() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Informações de Envio</h1>
        <div className="prose prose-sm text-gray-600 space-y-4">
           <p>Trabalhamos com diversas transportadoras para garantir que seu pedido chegue com rapidez e segurança.</p>
           <h3>Prazos e Valores</h3>
           <p>O custo do frete e o prazo de entrega são calculados no checkout, baseados no peso e dimensões do pacote, além da distância até o destino.</p>
           <h3>Rastreamento</h3>
           <p>Assim que o pedido for despachado, você receberá um e-mail com o código de rastreamento.</p>
        </div>
      </main>
      <Fuuter />
    </div>
  );
}

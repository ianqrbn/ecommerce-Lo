import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';

export default function Devolucoes() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Trocas e Devoluções</h1>
        <div className="prose prose-sm text-gray-600 space-y-4">
           <p>Queremos que você esteja 100% satisfeito com sua compra. Se precisar trocar ou devolver um produto, siga as instruções abaixo.</p>
           <h3>Prazo</h3>
           <p>Você tem até 7 dias corridos após o recebimento do pedido para solicitar a devolução ou troca (Direito de Arrependimento).</p>
           <h3>Condições</h3>
           <p>O produto deve estar na embalagem original, sem indícios de uso, acompanhado de todos os acessórios.</p>
        </div>
      </main>
      <Fuuter />
    </div>
  );
}

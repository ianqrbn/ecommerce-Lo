import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Sobre Nós</h1>
        <div className="prose prose-sm text-gray-600 space-y-4">
           <p>Bem-vindo à nossa loja! Somos apaixonados por oferecer os melhores produtos com a mais alta qualidade.</p>
           <p>Nossa missão é proporcionar uma experiência de compra incrível, com peças exclusivas e atendimento excepcional.</p>
           <p>Mais detalhes sobre a nossa história serão adicionados aqui em breve.</p>
        </div>
      </main>
      <Fuuter />
    </div>
  );
}

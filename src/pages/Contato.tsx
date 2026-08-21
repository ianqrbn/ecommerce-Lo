import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';

export default function Contato() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Central de Atendimento</h1>
        <div className="prose prose-sm text-gray-600 space-y-4">
          <p>Precisa de ajuda? Entre em contato conosco através dos nossos canais de atendimento:</p>
          <ul>
            <li><strong>E-mail:</strong> erro.silver@gmail.com</li>
            <li><strong>Telefone:</strong> (11) 99999-9999</li>
            <li><strong>Horário de Atendimento:</strong> Segunda a Sexta, das 9h às 18h</li>
          </ul>
          {/* Futuramente podemos adicionar um formulário de contato aqui */}
        </div>
      </main>
      <Fuuter />
    </div>
  );
}

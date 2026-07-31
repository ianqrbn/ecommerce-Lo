import React from 'react';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';

export default function Termos() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-serif text-gray-900 mb-8">Termos e Condições / Privacidade</h1>
        <div className="prose prose-sm text-gray-600 space-y-4">
           <h3>1. Termos de Uso</h3>
           <p>Ao acessar e usar este site, você concorda em cumprir estes termos e condições de uso.</p>
           
           <h3>2. Política de Privacidade</h3>
           <p>Nós valorizamos sua privacidade. Seus dados pessoais são utilizados apenas para processar pedidos e melhorar sua experiência na loja. Não compartilhamos suas informações com terceiros sem seu consentimento expresso.</p>

           <h3>3. Segurança</h3>
           <p>Utilizamos protocolos de segurança avançados para garantir que suas informações de pagamento e dados pessoais estejam sempre protegidos.</p>
        </div>
      </main>
      <Fuuter />
    </div>
  );
}

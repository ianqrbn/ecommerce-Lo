import React, { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { FeaturedProducts } from './components/FeaturedProducts';
import { CategoryShowcase } from './components/CategoryShowcase';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Promotional Banner */}
      <div className="bg-vinho-700 text-white text-center py-2.5 px-4">
        <p className="text-sm">
          Frete Grátis Para Compras Acima de R$150
        </p>
      </div>

      {/* Header */}
      <Header />

      {/* Promotional Strip */}
      <div className="bg-vinho-700 text-center py-3 px-4">
        <p className="text-sm text-white">
          <span className="font-semibold">Oferta Especial:</span> 15% off na primeira compra
        </p>
      </div>

      {/* Main Content */}
      <main>
        <HeroSection />
        <CategoryShowcase />
        <FeaturedProducts />
      </main>

      {/* Footer */}
      <footer className="bg-vinho-700 text-white py-12 px-4 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg mb-4">SOBRE NÓS</h3>
            <p className="text-sm text-vinho-100">
              Reunimos as melhores joias para manter sua elegância.
            </p>
          </div>
          <div>
            <h3 className="text-lg mb-4">ACESSOS RÁPIDOS</h3>
            <ul className="space-y-2 text-sm text-vinho-100">
              <li><a href="#" className="hover:text-white transition">Todos os Produtos</a></li>
              <li><a href="#" className="hover:text-white transition">Lançamentos</a></li>
              <li><a href="#" className="hover:text-white transition">Guia de Presentes</a></li>
              <li><a href="#" className="hover:text-white transition">Promoção</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg mb-4">SUPORTE AO CLIENTE</h3>
            <ul className="space-y-2 text-sm text-vinho-100">
              <li><a href="#" className="hover:text-white transition">Central de Atendimento</a></li>
              <li><a href="#" className="hover:text-white transition">Informações de Envio</a></li>
              <li><a href="#" className="hover:text-white transition">Devoluções</a></li>
              <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg mb-4">NEWSLETTER</h3>
            <p className="text-sm text-vinho-100 mb-3">
              Se inscreva para novas ofertas!
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Seu email"
                className="flex-1 px-3 py-2 rounded bg-white text-vinho-900 text-sm"
              />
              <button className="px-4 py-2 bg-white text-vinho-900 rounded hover:bg-vinho-100 transition text-sm">
                Seguir
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-vinho-700 text-center text-sm text-vinho-100">
          <p>Copyright &copy; 2025 ERRo, todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

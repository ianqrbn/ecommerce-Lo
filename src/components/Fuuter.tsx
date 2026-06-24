import React from 'react';

export function Fuuter() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-4 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sobre Nós */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">SOBRE NÓS</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Reunimos as melhores joias para manter sua elegância.
          </p>
        </div>

        {/* Acessos Rápidos */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">ACESSOS RÁPIDOS</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Todos os Produtos</a></li>
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Lançamentos</a></li>
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Guia de Presentes</a></li>
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Promoção</a></li>
          </ul>
        </div>

        {/* Suporte */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">SUPORTE AO CLIENTE</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Central de Atendimento</a></li>
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Informações de Envio</a></li>
            <li><a href="#" className="hover:text-vinho-700 transition-colors">Devoluções</a></li>
            <li><a href="#" className="hover:text-vinho-700 transition-colors">FAQ</a></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">NEWSLETTER</h3>
          <p className="text-sm text-gray-600 mb-4">
            Se inscreva para novas ofertas!
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Seu email"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 transition-all"
            />
            <button className="px-5 py-2 bg-vinho-700 text-white rounded-md hover:bg-vinho-800 transition-colors text-sm font-medium shadow-sm">
              Seguir
            </button>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-gray-100 text-center text-sm text-gray-500">
        <p>ERRo</p>
        <p>Copyright &copy; 2026, todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
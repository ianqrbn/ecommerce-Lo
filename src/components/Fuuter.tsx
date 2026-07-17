import React from 'react';

export function Fuuter() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-16 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left md:justify-items-center">

        {/* Sobre Nós */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">SOBRE NÓS</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="#" className=" transition-colors">Redes Sociais</a></li>
            <li><a href="#" className=" transition-colors">Sobre a Loja</a></li>
            <li><a href="#" className=" transition-colors">Seja Nosso Parceiro</a></li>
          </ul>
        </div>

        {/* Acessos Rápidos */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">ACESSOS RÁPIDOS</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="#" className=" transition-colors">Todos os Produtos</a></li>
            <li><a href="#" className=" transition-colors">Lançamentos</a></li>
            <li><a href="#" className=" transition-colors">Promoção</a></li>
          </ul>
        </div>

        {/* Suporte */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">SUPORTE AO CLIENTE</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="#" className=" transition-colors">Central de Atendimento</a></li>
            <li><a href="#" className=" transition-colors">Informações de Envio</a></li>
            <li><a href="#" className=" transition-colors">Devoluções</a></li>
            <li><a href="#" className=" transition-colors">FAQ</a></li>
          </ul>
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
import React from 'react';
import { Link } from 'react-router-dom';

export function Fuuter() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8 px-16 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left md:justify-items-center">

        {/* Sobre Nós */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">SOBRE NÓS</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className=" transition-colors hover:text-vinho-700">Redes Sociais</a></li>
            <li><Link to="/sobre" className=" transition-colors hover:text-vinho-700">Sobre a Loja</Link></li>
            <li><Link to="/termos" className=" transition-colors hover:text-vinho-700">Termos e Privacidade</Link></li>
          </ul>
        </div>

        {/* Acessos Rápidos */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">ACESSOS RÁPIDOS</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><Link to="/busca" className=" transition-colors hover:text-vinho-700">Todos os Produtos</Link></li>
            <li><Link to="/busca" className=" transition-colors hover:text-vinho-700">Lançamentos</Link></li>
            <li><Link to="/busca" className=" transition-colors hover:text-vinho-700">Promoção</Link></li>
          </ul>
        </div>

        {/* Suporte */}
        <div>
          <h3 className="text-sm font-serif text-gray-900 tracking-wider mb-4">SUPORTE AO CLIENTE</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li><Link to="/contato" className=" transition-colors hover:text-vinho-700">Central de Atendimento</Link></li>
            <li><Link to="/envio" className=" transition-colors hover:text-vinho-700">Informações de Envio</Link></li>
            <li><Link to="/devolucoes" className=" transition-colors hover:text-vinho-700">Devoluções</Link></li>
            <li><Link to="/faq" className=" transition-colors hover:text-vinho-700">FAQ</Link></li>
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
import React, { useState, useEffect } from 'react';
import { Search, User, ShoppingCart, Menu, X } from 'lucide-react';

export function Header() {
  const [cartCount, setCartCount] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Efeito para monitorar a rolagem da página
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-vinho-400 font-serif w-full transition-all duration-300">

      {/* Main Header - A cor e o padding mudam dependendo do scroll */}
      <div className={`bg-vinho-800 px-4 transition-all duration-300 ${isScrolled ? 'py-2 shadow-md' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            
            {/* Esquerda: Menu Sanduíche + Logo */}
            <div className="flex items-center gap-4">
              {/* O Menu Sanduíche aparece sempre no mobile. No desktop, ele só aparece se houver scroll */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`text-white ${isScrolled ? 'block' : 'lg:hidden'}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo - Fica menor durante o scroll */}
              <h1 className={`tracking-widest text-white transition-all duration-300 ${isScrolled ? 'text-xl' : 'text-2xl lg:text-3xl'}`}>
                ERRo
              </h1>
            </div>

            {/* Centro: Search Bar - Desktop */}
            {/* A barra de pesquisa agora fica fixa e visível o tempo todo (lg:flex) */}
            <div className="hidden lg:flex flex-1 max-w-md transition-all duration-300">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Pesquise por nome ou código"
                  className="font-serif bg-white w-full px-4 py-2 pr-10 border border-vinho-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinho-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vinho-400" />
              </div>
            </div>

            {/* Direita: Icons */}
            <div className="flex items-center gap-3 lg:gap-4">
              <button className="text-white hover:text-vinho-100 transition">
                <User className="w-5 h-5" />
              </button>
              <button className="relative text-white hover:text-vinho-100 transition">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-vinho-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          {/* Removida a lógica de esconder, a barra continuará visível abaixo da logo ao rolar */}
          <div className="lg:hidden mt-3 transition-all duration-300">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar"
                className="font-serif bg-white w-full px-4 py-2 pr-10 border border-vinho-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinho-400 text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vinho-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar (Links Horizontais) */}
      {/* Escondemos a barra de navegação no desktop se houver scroll para economizar espaço vertical */}
      <nav className={`bg-vinho-800 border-t border-vinho-400 transition-all duration-300 origin-top ${mobileMenuOpen ? 'block' : isScrolled ? 'hidden' : 'hidden lg:block'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ul className="text-white flex flex-col lg:flex-row lg:items-center lg:justify-center gap-3 lg:gap-8 text-sm">
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">ANÉIS</a></li>
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">COLARES</a></li>
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">BRINCOS</a></li>
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">PULSEIRAS</a></li>
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">COLEÇÕES</a></li>
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">PRESENTES</a></li>
            <li><a href="#" className="transition block py-2 lg:py-0 hover:text-vinho-100">PROMOÇÕES</a></li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
import React, { useState } from 'react';
import { Search, User, ShoppingCart, MapPin, Menu, X } from 'lucide-react';

export function Header() {
  const [cartCount, setCartCount] = useState(3);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-vinho-200">
      {/* Top Bar */}
      <div className="bg-white py-3 px-4 border-b border-vinho-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-vinho-600">
            <a href="#" className="hover:text-vinho-900 transition hidden sm:inline">Acompanhar Pedido</a>
            <a href="#" className="hover:text-vinho-900 transition">Ajuda</a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-vinho-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <div className="flex-1 lg:flex-none text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl tracking-widest">
                ERRo
              </h1>
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden lg:flex flex-1 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Pesquise por nome ou código"
                  className="w-full px-4 py-2 pr-10 border border-vinho-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinho-400 text-sm"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vinho-400" />
              </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-3 lg:gap-4">
              <button className="lg:hidden text-vinho-700">
                <Search className="w-5 h-5" />
              </button>
              <button className="text-vinho-700 hover:text-vinho-900 transition">
                <User className="w-5 h-5" />
              </button>
              <button className="relative text-vinho-700 hover:text-vinho-900 transition">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-vinho-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <div className="lg:hidden mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar"
                className="w-full px-4 py-2 pr-10 border border-vinho-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vinho-400 text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vinho-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`bg-white border-t border-vinho-100 ${mobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ul className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-3 lg:gap-8 text-sm">
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                LANÇAMENTOS
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                ANÉIS
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                COLARES
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                BRINCOS
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                PULSEIRAS
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                COLEÇÕES
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-vinho-600 transition block py-2 lg:py-0">
                PRESENTES
              </a>
            </li>
            <li>
              <a href="#" className="text-red-600 hover:text-red-700 transition block py-2 lg:py-0">
                PROMOÇÕES
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}

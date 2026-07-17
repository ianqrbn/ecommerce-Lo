import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CategoryShowcase() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCategories() {
      // Busca as categorias do seu banco de dados
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, descricao, slug, imagem_url')
      // Limitando a 3 para manter o layout em grid perfeito

      if (error) {
        console.error('Erro ao buscar categorias:', error);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Cabeçalho da Seção Minimalista */}
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-vinho-700 tracking-[0.2em] uppercase mb-3">
            Compre por Categoria
          </p>
          <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
            Joias Autorais
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="text-gray-400">Carregando coleções...</span>
          </div>
        ) : (
          <div className="relative group">
            {/* Botão de Voltar */}
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/3 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md text-gray-800 hover:text-vinho-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 hidden md:block focus:outline-none"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Container do Carrossel */}
            <div
              ref={carouselRef}
              className="flex gap-8 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8 pt-4"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => navigate(`/categoria/${category.slug}`)}
                  className="group cursor-pointer flex-none w-64 sm:w-80 snap-start flex flex-col"
                >
                  {/* Imagem Limpa sem overlay pesado */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 rounded-sm mb-6">
                    <img
                      src={category.imagem_url || 'https://via.placeholder.com/800'}
                      alt={category.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  {/* Textos abaixo da imagem, focados no White Space */}
                  <div className="text-center flex-1 flex flex-col items-center">
                    <h3 className="text-xl font-serif text-gray-900 mb-2">
                      {category.nome}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 px-4">
                      {category.descricao}
                    </p>

                    {/* Botão sutil que usa o vinho apenas no hover */}
                    <button className="mt-auto flex items-center gap-2 text-sm font-medium text-gray-900 group-hover:text-vinho-700 transition-colors">
                      Explorar
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão de Avançar */}
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/3 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md text-gray-800 hover:text-vinho-700 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100 hidden md:block focus:outline-none"
              aria-label="Próximo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
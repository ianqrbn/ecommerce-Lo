import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  titulo: string;
  tipo: 'categoria' | 'mais_vendidos' | 'mais_curtidos' | 'lancamentos';
  categoriaSlug?: string;
}

export function ProductCarousel({ titulo, tipo, categoriaSlug }: ProductCarouselProps) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Referência para controlar o scroll do carrossel
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      let query = supabase
        .from('produtos')
        .select(`
          id, 
          nome, 
          preco, 
          imagem_principal, 
          data_criacao,
          qtd_favoritos,
          cat_prod!inner (
            categorias!inner (
              nome,
              slug
            )
          )
        `)
        .eq('ativo', true);

      // Filtro por categoria
      if (tipo === 'categoria' && categoriaSlug) {
        query = query.eq('cat_prod.categorias.slug', categoriaSlug);
      }

      // Ordenação
      if (tipo === 'mais_curtidos' || tipo === 'mais_vendidos') {
        query = query.order('qtd_favoritos', { ascending: false, nullsFirst: false });
      } else if (tipo === 'lancamentos') {
        query = query.order('data_criacao', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('qtd_favoritos', { ascending: false, nullsFirst: false }); // default
      }

      const { data, error } = await query.limit(8);

      if (error) {
        console.error('Erro ao buscar produtos para o carrossel:', error);
      } else if (data) {
        const mappedProducts = data.map((prod: any) => ({
          ...prod,
          categoria_nome: prod.cat_prod?.[0]?.categorias?.nome || 'Sem Categoria'
        }));
        setProducts(mappedProducts);
      }
      setLoading(false);
    }

    fetchProducts();
  }, [tipo, categoriaSlug]);

  // Função para mover o carrossel
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 px-4 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-2">{titulo}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="text-gray-400">Carregando produtos...</span>
          </div>
        ) : (
          <div className="relative group">

            {/* Botão de Voltar - Visível apenas no hover da área do carrossel no Desktop */}
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
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Esconde a barra de rolagem no Firefox e IE
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  // Configuração de largura para os itens do carrossel (responsivo)
                  className="group relative flex-none w-64 sm:w-72 snap-start"
                >
                  <ProductCard product={product} categoryName={product.categoria_nome} />
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

      {/* Adicione este CSS globalmente (ex: index.css) se preferir, ou deixe aqui para garantir */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
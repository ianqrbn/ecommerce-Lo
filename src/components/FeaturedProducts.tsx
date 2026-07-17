import React, { useEffect, useState, useRef } from 'react';
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

export function FeaturedProducts() {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  // Referência para controlar o scroll do carrossel
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      // Busca otimizada em 1 requisição com Join (Muitos para Muitos)
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          id, 
          nome, 
          preco, 
          imagem_principal, 
          cat_prod (
            categorias (
              nome
            )
          )
        `)
        .eq('ativo', true)
        .limit(8);

      if (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
      } else if (data) {
        // Extrai o nome da categoria da resposta aninhada do Supabase
        const mappedProducts = data.map((prod: any) => ({
          ...prod,
          categoria_nome: prod.cat_prod?.[0]?.categorias?.nome || 'Sem Categoria'
        }));
        setProducts(mappedProducts);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  // Função para mover o carrossel
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <section className="py-16 px-4 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif text-gray-900 mb-2">Peças em Destaque</h2>
          <p className="text-gray-500">Peças selecionadas para sua elegância</p>
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
                  {/* Imagem */}
                  <div className="relative aspect-[4/5] bg-gray-50 mb-4 overflow-hidden rounded-md">
                    <img
                      src={product.imagem_principal || 'https://via.placeholder.com/500'}
                      alt={product.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                    />

                    {/* Ações Hover */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="bg-white rounded-full p-2 shadow-sm hover:text-vinho-700 transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${addedItems[product.id]
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-vinho-700 text-white hover:bg-vinho-800'
                          }`}
                      >
                        {addedItems[product.id] ? (
                          <>
                            <Check className="w-4 h-4" />
                            Adicionado
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Adicionar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Textos */}
                  <div className="text-center mt-4">
                    <p className="text-xs text-vinho-700 font-medium mb-1 uppercase tracking-widest">
                      {product.categoria_nome}
                    </p>
                    <h3 className="text-sm text-gray-900 mb-1">{product.nome}</h3>
                    <p className="text-sm font-medium text-gray-600">
                      R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                    </p>
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

        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/busca')}
            className="border border-vinho-400 text-gray-900 px-8 py-3 hover:bg-vinho-800 hover:text-white transition-colors text-sm tracking-wide cursor-pointer"
          >
            VER TODOS OS PRODUTOS
          </button>
        </div>
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
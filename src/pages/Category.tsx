import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';
import { Heart, ShoppingCart, Check, ChevronRight, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');

  const { addToCart } = useCart();

  // Dados do DB
  const [products, setProducts] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  // Estados de Filtro e Ordenação
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Estado para menu de filtros no mobile
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchCategoryAndProducts() {
      setLoading(true);

      if (slug) {
        // MODO CATEGORIA
        // 1. Busca informações da categoria
        const { data: catData } = await supabase
          .from('categorias')
          .select('nome')
          .eq('slug', slug)
          .single();

        if (catData) {
          setCategoryName(catData.nome);
        }

        // 2. Busca produtos da categoria
        const { data, error } = await supabase
          .from('produtos')
          .select(`
            id, 
            nome, 
            preco, 
            imagem_principal, 
            cat_prod!inner (
              categorias!inner (
                slug
              )
            )
          `)
          .eq('ativo', true)
          .eq('cat_prod.categorias.slug', slug);

        if (error) {
          console.error('Erro ao buscar produtos:', error);
          setProducts([]);
        } else {
          setProducts(data || []);
        }
      } else {
        // MODO BUSCA GLOBAL OU CATÁLOGO GERAL
        setCategoryName(query ? `Resultados para "${query}"` : 'Todos os Produtos');
        
        let supabaseQuery = supabase
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
          .eq('ativo', true);

        if (query) {
          supabaseQuery = supabaseQuery.ilike('nome', `%${query}%`);
        }

        const { data, error } = await supabaseQuery;

        if (error) {
          console.error('Erro ao buscar produtos:', error);
          setProducts([]);
        } else if (data) {
          // Mapeia as categorias reais de cada produto retornado na pesquisa geral
          const mapped = data.map((p: any) => ({
            ...p,
            categoria_nome: p.cat_prod?.[0]?.categorias?.nome || 'Sem Categoria'
          }));
          setProducts(mapped);
        }
      }

      setLoading(false);
    }

    // Resetar filtros ao trocar de página/pesquisa
    setPriceMin('');
    setPriceMax('');
    setSortBy('relevance');
    fetchCategoryAndProducts();
  }, [slug, query]);

  // Efeito de Filtro e Ordenação (Roda no Client-side sempre que estados mudam)
  useEffect(() => {
    let result = [...products];

    // Aplicar filtro de Preço
    if (priceMin !== '') {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) {
        result = result.filter(p => Number(p.preco) >= min);
      }
    }
    if (priceMax !== '') {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) {
        result = result.filter(p => Number(p.preco) <= max);
      }
    }

    // Aplicar Ordenação
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => Number(a.preco) - Number(b.preco));
        break;
      case 'price_desc':
        result.sort((a, b) => Number(b.preco) - Number(a.preco));
        break;
      case 'name_asc':
        result.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'name_desc':
        result.sort((a, b) => b.nome.localeCompare(a.nome));
        break;
      case 'sales_desc':
        // Placeholder para "Mais Vendidos"
        result.sort((a, b) => b.id - a.id);
        break;
      case 'relevance':
      default:
        // Mantém ordem de criação ou ordem que veio do banco (por ID)
        result.sort((a, b) => a.id - b.id);
        break;
    }

    setFilteredProducts(result);
  }, [products, priceMin, priceMax, sortBy]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (


    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-8 ">
        {/* Navegação Breadcrumb e Título */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
            {categoryName || (loading ? 'Carregando...' : '')}
          </h1>
          <p className="text-gray-500">
            Mostrando {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vinho-700"></div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Botão Mobile de Filtros */}
            <div className="lg:hidden flex justify-between items-center mb-4">
              <button
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros e Ordenação
              </button>
            </div>

            {/* Sidebar - Filtros (Desktop e Mobile Collapse) */}
            <aside className={`w-full lg:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-24 space-y-8 bg-gray-50 p-6 rounded-lg border border-gray-100">

                {/* Ordenação */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-serif font-medium text-gray-900 uppercase tracking-widest mb-4">
                    <ArrowUpDown className="w-4 h-4 text-vinho-700" />
                    Ordenar
                  </h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-vinho-700 focus:border-vinho-700 block p-2.5 transition-colors cursor-pointer"
                  >
                    <option value="relevance">Mais Relevantes</option>
                    <option value="sales_desc">Mais Vendidos</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                    <option value="name_asc">Ordem Alfabética (A-Z)</option>
                    <option value="name_desc">Ordem Alfabética (Z-A)</option>
                  </select>
                </div>

                <hr className="border-gray-200" />

                {/* Filtro de Preço */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-serif font-medium text-gray-900 uppercase tracking-widest mb-4">
                    <SlidersHorizontal className="w-4 h-4 text-vinho-700" />
                    Preço
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">R$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Mín"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-vinho-700 focus:border-vinho-700 block p-2.5 pl-8"
                      />
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-sm">R$</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Máx"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-vinho-700 focus:border-vinho-700 block p-2.5 pl-8"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </aside>

            {/* Grid de Produtos */}
            <main className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100 h-full flex flex-col justify-center items-center">
                  <h3 className="text-xl font-serif text-gray-900 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-500 mb-6">Tente ajustar seus filtros para ver mais resultados.</p>
                  <button
                    onClick={() => { setPriceMin(''); setPriceMax(''); setSortBy('relevance'); }}
                    className="px-6 py-2 bg-vinho-700 text-white rounded hover:bg-vinho-800 transition-colors text-sm font-medium"
                  >
                    Limpar Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group relative flex flex-col">
                      <div className="relative aspect-[4/5] bg-gray-50 mb-4 overflow-hidden rounded-md">
                        <img
                          src={product.imagem_principal || 'https://via.placeholder.com/500'}
                          alt={product.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />

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

                      <div className="text-center mt-auto">
                        <p className="text-xs text-vinho-700 font-medium mb-1 uppercase tracking-widest">
                          {product.categoria_nome || (slug ? categoryName : 'Produto')}
                        </p>
                        <h3 className="text-sm text-gray-900 mb-1">{product.nome}</h3>
                        <p className="text-sm font-medium text-gray-600">
                          R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
      {/* Footer */}
      <Fuuter />
    </div>
  );
}

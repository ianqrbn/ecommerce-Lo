import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';
import { ProductCard } from '../components/ProductCard';
import { Link } from 'react-router-dom';

export default function Favoritos() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavoritos() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from('favoritos')
        .select(`
          produtos (
            id,
            nome,
            preco,
            imagem_principal,
            cat_prod (
              categorias (
                nome
              )
            )
          )
        `)
        .eq('usuario_id', user.id);

      if (error) {
        console.error('Erro ao buscar favoritos:', error);
      } else if (data) {
        const mappedProducts = data
          .map((item: any) => {
            const p = item.produtos;
            if (!p) return null;
            return {
              ...p,
              categoria_nome: p.cat_prod?.[0]?.categorias?.nome || 'Sem Categoria',
            };
          })
          .filter(Boolean); // Remove nulls if any
          
        setProducts(mappedProducts);
      }
      setLoading(false);
    }

    fetchFavoritos();
  }, [user]);

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">Meus Favoritos</h1>
          <p className="text-gray-500">
            {products.length} {products.length === 1 ? 'produto salvo' : 'produtos salvos'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vinho-700"></div>
          </div>
        ) : !user ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
            <h3 className="text-xl font-serif text-gray-900 mb-2">Você precisa estar logado</h3>
            <p className="text-gray-500 mb-6">Faça login para ver e gerenciar seus produtos favoritos.</p>
            <Link to="/login" className="px-6 py-2 bg-vinho-700 text-white rounded hover:bg-vinho-800 transition-colors text-sm font-medium">
              Fazer Login
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100 h-full flex flex-col justify-center items-center">
            <h3 className="text-xl font-serif text-gray-900 mb-2">Sua lista está vazia</h3>
            <p className="text-gray-500 mb-6">Você ainda não adicionou nenhum produto aos favoritos.</p>
            <Link to="/busca" className="px-6 py-2 bg-vinho-700 text-white rounded hover:bg-vinho-800 transition-colors text-sm font-medium">
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} categoryName={product.categoria_nome} />
            ))}
          </div>
        )}
      </div>

      <Fuuter />
    </div>
  );
}

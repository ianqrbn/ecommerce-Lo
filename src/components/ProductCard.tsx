import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: any;
  categoryName?: string;
}

export function ProductCard({ product, categoryName }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isFavorito, setIsFavorito] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkFavorito() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('favoritos')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('produto_id', product.id)
        .maybeSingle();

      if (isMounted && data) {
        setIsFavorito(true);
      }
    }
    checkFavorito();

    return () => {
      isMounted = false;
    };
  }, [user, product.id]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Você precisa fazer login para favoritar um produto.');
      navigate('/login');
      return;
    }

    if (loadingFav) return;

    const previousState = isFavorito;
    setIsFavorito(!isFavorito);
    setLoadingFav(true);

    try {
      if (previousState) {
        const { error } = await supabase
          .from('favoritos')
          .delete()
          .eq('usuario_id', user.id)
          .eq('produto_id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favoritos')
          .insert([{ usuario_id: user.id, produto_id: product.id }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      setIsFavorito(previousState);
      alert('Erro ao atualizar favoritos. Tente novamente.');
    } finally {
      setLoadingFav(false);
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group relative flex flex-col h-full w-full">
      <div className="relative aspect-[4/5] bg-gray-50 mb-4 overflow-hidden rounded-md">
        <img
          src={product.imagem_principal || 'https://via.placeholder.com/500'}
          alt={product.nome}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
        />

        <div className={`absolute top-3 right-3 transition-opacity ${isFavorito ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={handleToggleFavorite}
            disabled={loadingFav}
            className="bg-white rounded-full p-2 shadow-sm hover:text-vinho-700 transition-colors focus:outline-none cursor-pointer"
          >
            <Heart 
              className="w-4 h-4" 
              fill={isFavorito ? '#b91c1c' : 'transparent'} 
              color={isFavorito ? '#b91c1c' : 'currentColor'} 
            />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              added ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-vinho-700 text-white hover:bg-vinho-800'
            }`}
          >
            {added ? (
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
          {product.categoria_nome || categoryName || 'Produto'}
        </p>
        <h3 className="text-sm text-gray-900 mb-1">{product.nome}</h3>
        <p className="text-sm font-medium text-gray-600">
          R$ {Number(product.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>
    </div>
  );
}

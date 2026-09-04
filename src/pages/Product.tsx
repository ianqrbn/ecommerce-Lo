import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';
import { ShippingCalculator } from '../components/ShippingCalculator';
import { Heart, ShoppingCart, Check, ChevronRight, Star } from 'lucide-react';

export default function Product() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Imagens
  const [activeImage, setActiveImage] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);

  const [isFavorito, setIsFavorito] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [added, setAdded] = useState(false);

  // Variações e Detalhes
  const [selectedVariacao, setSelectedVariacao] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    async function getProductAndFavorite() {
      setLoading(true);

      // 1. Busca o produto e suas imagens (ordenadas por ordem se possível)
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          cat_prod (
            categorias (nome)
          ),
          imagens_produto (url, ordem),
          avaliacoes (nota, comentario, data_avaliacao, usuarios (nome, email)),
          produto_variacoes (id, nome, estoque)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar produto', error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const catNome = data.cat_prod?.[0]?.categorias?.nome || 'Sem Categoria';

        // Organiza as imagens
        const extraImages = data.imagens_produto
          ? data.imagens_produto.sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0)).map((f: any) => f.url)
          : [];

        // A lista de imagens terá a principal primeiro, seguida pelas extras (evitando duplicatas se for a mesma url)
        let allImages = [];
        if (data.imagem_principal) {
          allImages.push(data.imagem_principal);
        }
        allImages = [...allImages, ...extraImages.filter((img: string) => img !== data.imagem_principal)];

        setProduct({
          ...data,
          categoria_nome: catNome,
        });

        setImages(allImages);
        if (allImages.length > 0) {
          setActiveImage(allImages[0]);
        }

        // 2. Verifica se é favorito
        if (user) {
          const { data: favData } = await supabase
            .from('favoritos')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('produto_id', id)
            .maybeSingle();

          if (favData) {
            setIsFavorito(true);
          }
        }

        // 3. Busca as avaliações do produto
        const { data: avaliacoesData } = await supabase
          .from('avaliacoes')
          .select(`
            id,
            nota,
            comentario,
            data_avaliacao,
            usuarios (nome)
          `)
          .eq('produto_id', id)
          .order('data_avaliacao', { ascending: false });

        if (avaliacoesData) {
          setAvaliacoes(avaliacoesData);
        }
      }
      setLoading(false);
    }

    getProductAndFavorite();
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Você precisa fazer login para favoritar um produto.');
      navigate('/login');
      return;
    }
    if (!product) return;
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
    if (!product) return;

    const temVariacoes = product.produto_variacoes && product.produto_variacoes.length > 0;
    if (temVariacoes && !selectedVariacao) {
      alert("Por favor, selecione um tamanho/variação antes de adicionar ao carrinho.");
      return;
    }

    addToCart(product, 1, selectedVariacao?.nome);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vinho-700"></div>
        </div>
        <Fuuter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
          <h1 className="text-3xl font-serif text-gray-900 mb-4">Produto não encontrado</h1>
          <p className="text-gray-500 mb-8">O produto que você está procurando não existe ou foi removido.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-vinho-700 text-white rounded hover:bg-vinho-800 transition-colors">
            Voltar para o início
          </button>
        </div>
        <Fuuter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate('/')} className="hover:text-vinho-700 transition-colors">Início</button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">{product.categoria_nome}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="truncate">{product.nome}</span>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

          {/* Esquerda: Galeria de Imagens (Abaixo) */}
          <div className="w-full md:w-1/2 flex flex-col">
            {/* Imagem Principal */}
            <div className="w-full aspect-[4/5] bg-gray-50 rounded-lg overflow-hidden border border-gray-100 mb-4">
              <img
                src={activeImage || 'https://via.placeholder.com/600'}
                alt={product.nome}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Miniaturas (Abaixo) */}
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-24 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${activeImage === img ? 'border-vinho-700' : 'border-transparent hover:border-vinho-300'
                      }`}
                  >
                    <img src={img} alt={`Miniatura ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direita: Informações do Produto */}
          <div className="w-full md:w-1/2 flex flex-col">
            <span className="text-sm font-semibold text-vinho-700 tracking-widest uppercase mb-2">
              {product.categoria_nome}
            </span>
            <h1 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">
              {product.nome}
            </h1>

            <div className="text-2xl text-gray-900 text-sm mb-8">
              R$ {Number(product.preco).toFixed(2).replace('.', ',')}
            </div>

            <div className="prose prose-sm text-gray-600 mb-10 max-w-none">
              {product.descricao ? (
                <p className="whitespace-pre-line leading-relaxed text-base">{product.descricao}</p>
              ) : (
                <p>Nenhuma descrição disponível para este produto.</p>
              )}
            </div>


            {/* Variações (Tamanhos) */}
            {product.produto_variacoes && product.produto_variacoes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Selecione o Tamanho:</h3>
                <div className="flex flex-wrap gap-3">
                  {product.produto_variacoes.map((variacao: any) => {
                    const isEsgotado = variacao.estoque <= 0;
                    const isSelected = selectedVariacao?.id === variacao.id;
                    return (
                      <button
                        key={variacao.id}
                        onClick={() => setSelectedVariacao(variacao)}
                        disabled={isEsgotado}
                        className={`px-4 py-2 text-sm font-medium rounded border transition-all ${isEsgotado
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : isSelected
                              ? 'bg-vinho-700 text-white border-vinho-700'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-vinho-700 hover:text-vinho-700'
                          }`}
                      >
                        {variacao.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="mt-auto pt-6 flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={(product.produto_variacoes?.length === 0 && product.estoque <= 0) || (selectedVariacao && selectedVariacao.estoque <= 0)}
                className={`flex-1 py-4 px-6 rounded text-sm font-medium transition-all flex items-center justify-center gap-2 ${(product.produto_variacoes?.length === 0 && product.estoque <= 0) || (selectedVariacao && selectedVariacao.estoque <= 0)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : added
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                      : 'bg-vinho-700 text-white hover:bg-vinho-800 shadow-md hover:shadow-lg'
                  }`}
              >
                {(product.produto_variacoes?.length === 0 && product.estoque <= 0) || (selectedVariacao && selectedVariacao.estoque <= 0) ? (
                  'Esgotado'
                ) : added ? (
                  <>
                    <Check className="w-5 h-5" />
                    Adicionado ao Carrinho
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Adicionar ao Carrinho
                  </>
                )}
              </button>

              <button
                onClick={handleToggleFavorite}
                disabled={loadingFav}
                className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded text-gray-500 hover:text-vinho-700 hover:border-vinho-300 hover:bg-vinho-50 transition-colors focus:outline-none cursor-pointer"
                title={isFavorito ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
              >
                <Heart
                  className="w-6 h-6"
                  fill={isFavorito ? '#b91c1c' : 'transparent'}
                  color={isFavorito ? '#b91c1c' : 'currentColor'}
                />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400">
              {product.produto_variacoes?.length > 0 ? (
                <p>
                  Estoque: {selectedVariacao ? `${selectedVariacao.estoque} unidades no ${selectedVariacao.nome}` : 'Selecione um tamanho'}
                </p>
              ) : (
                <>
                  <p>Em estoque: {product.estoque} unidades</p>
                  {product.estoque <= 5 && product.estoque > 0 && (
                    <p className="text-orange-500 font-medium">Corra, restam poucas unidades!</p>
                  )}
                </>
              )}
            </div>

            <div className="mt-8">
              <ShippingCalculator items={[{ id: product.id, quantity: 1 }]} />
            </div>

          </div>
        </div>

        {/* Seção de Detalhes Dinâmicos (JSONB) */}
        {product.detalhes && Object.keys(product.detalhes).length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-100">
            <h2 className="text-2xl font-serif text-gray-900 mb-6">Detalhes Técnicos</h2>
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
              <table className="w-full text-left text-sm text-gray-700">
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(product.detalhes).map(([key, value]) => (
                    <tr key={key} className="hover:bg-gray-100/50 transition-colors">
                      <td className="py-3 px-6 font-medium text-gray-900 w-1/3 bg-gray-100/30">{key}</td>
                      <td className="py-3 px-6 w-2/3">{value as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Seção de Avaliações */}
        <div className="mt-16 pt-10 border-t border-gray-100">
          <h2 className="text-2xl font-serif text-gray-900 mb-6">Avaliações do Produto</h2>

          {avaliacoes.length === 0 ? (
            <p className="text-gray-500">Este produto ainda não possui avaliações.</p>
          ) : (
            <div className="space-y-6">
              {avaliacoes.map((av) => (
                <div key={av.id} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-vinho-100 rounded-full flex items-center justify-center text-vinho-700 font-bold">
                        {av.usuarios?.nome ? av.usuarios.nome.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{av.usuarios?.nome || 'Usuário Anônimo'}</p>
                        <p className="text-sm text-gray-500">
                          {av.data_avaliacao ? new Date(av.data_avaliacao).toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < (av.nota || 0) ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700">{av.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Fuuter />

      {/* Hide scrollbar for thumbnails */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, Image as ImageIcon, LayoutList, Plus, Trash2, GripVertical } from 'lucide-react';

export interface LandingCarousel {
  id: string;
  titulo: string;
  tipo: 'categoria' | 'mais_vendidos' | 'mais_curtidos' | 'lancamentos';
  categoria_slug?: string;
}

export default function Configuracoes() {
  const [cepOrigem, setCepOrigem] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroCategorySlug, setHeroCategorySlug] = useState('');
  const [landingCarousels, setLandingCarousels] = useState<LandingCarousel[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConfigAndCategories();
  }, []);

  const fetchConfigAndCategories = async () => {
    try {
      // Busca categorias
      const { data: catsData, error: catsError } = await supabase
        .from('categorias')
        .select('id, nome, slug')
        .order('nome');
      if (!catsError && catsData) setCategorias(catsData);

      // Busca configurações
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .in('chave', ['cep_origem', 'hero_image_url', 'hero_category_slug']);

      if (error) throw error;
      if (data) {
        data.forEach(item => {
          if (item.chave === 'cep_origem') setCepOrigem(item.valor);
          if (item.chave === 'hero_image_url') setHeroImageUrl(item.valor);
          if (item.chave === 'hero_category_slug') setHeroCategorySlug(item.valor);
          if (item.chave === 'landing_carousels') {
            try {
              setLandingCarousels(JSON.parse(item.valor));
            } catch(e) {}
          }
        });
      }
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const cleanCep = cepOrigem.replace(/\D/g, '');
      if (cepOrigem && cleanCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos.');
      }

      const { error } = await supabase
        .from('configuracoes')
        .upsert([
          { chave: 'cep_origem', valor: cleanCep },
          { chave: 'hero_image_url', valor: heroImageUrl },
          { chave: 'hero_category_slug', valor: heroCategorySlug },
          { chave: 'landing_carousels', valor: JSON.stringify(landingCarousels) }
        ]);

      if (error) throw error;
      setMessage({ text: 'Configurações salvas com sucesso!', type: 'success' });
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setMessage({ text: err.message || 'Erro ao salvar configurações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-vinho-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações Gerais</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Frete e Envio</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CEP de Origem (Remetente)
          </label>
          <input
            type="text"
            value={cepOrigem}
            onChange={(e) => setCepOrigem(e.target.value)}
            placeholder="Apenas números"
            className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vinho-500 focus:border-vinho-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Este CEP será usado pela API do Melhor Envio para calcular o frete dos clientes.
          </p>
        </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-vinho-600 text-white px-4 py-2 rounded-md hover:bg-vinho-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-gray-500" />
          Hero Section (Capa da Loja)
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL da Imagem de Destaque
          </label>
          <input
            type="text"
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vinho-500 focus:border-vinho-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Cole a URL da imagem que aparecerá no banner principal da loja. Deixe em branco para usar a imagem padrão.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoria do Botão "Explorar"
          </label>
          <select
            value={heroCategorySlug}
            onChange={(e) => setHeroCategorySlug(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vinho-500 focus:border-vinho-500"
          >
            <option value="">Selecione uma categoria...</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.slug}>{cat.nome}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Escolha para qual categoria o botão "Explorar Coleção" deve redirecionar.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-vinho-600 text-white px-4 py-2 rounded-md hover:bg-vinho-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-gray-500" />
            Carrosséis da Página Inicial
          </h2>
          <button
            onClick={() => setLandingCarousels([...landingCarousels, { id: crypto.randomUUID(), titulo: 'Novo Carrossel', tipo: 'mais_vendidos' }])}
            className="flex items-center gap-2 text-sm text-vinho-600 hover:text-vinho-700 bg-vinho-50 hover:bg-vinho-100 px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Carrossel
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Configure as seções de produtos que aparecem na tela inicial (abaixo do Hero). 
          Você pode escolher entre Categorias, Mais Vendidos, Lançamentos, etc.
        </p>

        <div className="space-y-4 mb-6">
          {landingCarousels.length === 0 ? (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-200">
              Nenhum carrossel configurado. A página usará o padrão (Mais Curtidos).
            </div>
          ) : (
            landingCarousels.map((carousel, index) => (
              <div key={carousel.id} className="flex gap-4 items-start bg-gray-50 p-4 rounded-md border border-gray-200">
                <div className="flex-1 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Título da Seção</label>
                      <input
                        type="text"
                        value={carousel.titulo}
                        onChange={(e) => {
                          const newCarousels = [...landingCarousels];
                          newCarousels[index].titulo = e.target.value;
                          setLandingCarousels(newCarousels);
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-vinho-500"
                        placeholder="Ex: Joias Autorais"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Conteúdo</label>
                      <select
                        value={carousel.tipo}
                        onChange={(e) => {
                          const newCarousels = [...landingCarousels];
                          newCarousels[index].tipo = e.target.value as any;
                          setLandingCarousels(newCarousels);
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-vinho-500"
                      >
                        <option value="mais_vendidos">Mais Vendidos</option>
                        <option value="mais_curtidos">Mais Curtidos (Favoritos)</option>
                        <option value="lancamentos">Lançamentos</option>
                        <option value="categoria">Categoria Específica</option>
                      </select>
                    </div>
                  </div>
                  
                  {carousel.tipo === 'categoria' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Selecione a Categoria</label>
                      <select
                        value={carousel.categoria_slug || ''}
                        onChange={(e) => {
                          const newCarousels = [...landingCarousels];
                          newCarousels[index].categoria_slug = e.target.value;
                          setLandingCarousels(newCarousels);
                        }}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-vinho-500"
                      >
                        <option value="">Selecione...</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.slug}>{cat.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 pt-5">
                  <button
                    onClick={() => {
                      const newCarousels = landingCarousels.filter((_, i) => i !== index);
                      setLandingCarousels(newCarousels);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1">
                     <button 
                       disabled={index === 0}
                       onClick={() => {
                         const newCarousels = [...landingCarousels];
                         [newCarousels[index - 1], newCarousels[index]] = [newCarousels[index], newCarousels[index - 1]];
                         setLandingCarousels(newCarousels);
                       }}
                       className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30"
                       title="Subir"
                     >
                       ↑
                     </button>
                     <button 
                       disabled={index === landingCarousels.length - 1}
                       onClick={() => {
                         const newCarousels = [...landingCarousels];
                         [newCarousels[index + 1], newCarousels[index]] = [newCarousels[index], newCarousels[index + 1]];
                         setLandingCarousels(newCarousels);
                       }}
                       className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded disabled:opacity-30"
                       title="Descer"
                     >
                       ↓
                     </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-vinho-600 text-white px-4 py-2 rounded-md hover:bg-vinho-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

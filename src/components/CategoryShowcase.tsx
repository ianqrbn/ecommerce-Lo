import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight } from 'lucide-react'; // Ícone minimalista para o botão

export function CategoryShowcase() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      // Busca as categorias do seu banco de dados
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome, descricao, slug, imagem_url')
        .limit(3); // Limitando a 3 para manter o layout em grid perfeito

      if (error) {
        console.error('Erro ao buscar categorias:', error);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    }

    fetchCategories();
  }, []);

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {categories.map((category) => (
              <div
                key={category.id}
                className="group cursor-pointer flex flex-col"
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
        )}

      </div>
    </section>
  );
}
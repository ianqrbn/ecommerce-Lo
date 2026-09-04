import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function HeroSection() {
  const navigate = useNavigate();
  const [heroImage, setHeroImage] = useState('https://i.etsystatic.com/17396317/r/il/b44df2/1467882176/il_fullxfull.1467882176_reys.jpg');
  const [categorySlug, setCategorySlug] = useState('');

  useEffect(() => {
    fetchHeroConfig();
  }, []);

  const fetchHeroConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .in('chave', ['hero_image_url', 'hero_category_slug']);

      if (!error && data) {
        data.forEach(item => {
          if (item.chave === 'hero_image_url' && item.valor) setHeroImage(item.valor);
          if (item.chave === 'hero_category_slug') setCategorySlug(item.valor);
        });
      }
    } catch (err) {
      console.error('Erro ao buscar configuração do hero:', err);
    }
  };

  const handleExploreClick = () => {
    if (categorySlug) {
      navigate(`/categoria/${categorySlug}`);
    } else {
      navigate('/busca');
    }
  };

  return (
    <section className="border-vinho-400 relative h-64 md:h-80 lg:h-96 overflow-hidden bg-gradient-to-br from-vinho-100 to-vinho-200">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Coleção de joias de prata"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl p-8 flex items-end">
        <div className="text-white max-w-xl">
          <button 
            onClick={handleExploreClick}
            className="bg-vinho-800 text-white px-8 py-3 font-serif hover:bg-white hover:text-vinho-900 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Explorar
          </button>
        </div>
      </div>
    </section>
  );
}

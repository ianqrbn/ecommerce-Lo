import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ProductCarousel } from '../components/ProductCarousel';
import { Fuuter } from '../components/Fuuter';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [carousels, setCarousels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCarousels() {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'landing_carousels')
        .single();

      if (!error && data && data.valor) {
        try {
          setCarousels(JSON.parse(data.valor));
        } catch (e) {
          // Fallback if parsing fails
          setCarousels([]);
        }
      }
      setLoading(false);
    }
    fetchCarousels();
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main>
        <HeroSection />
        <CategoryShowcase />

        {!loading && (
          carousels.length > 0 ? (
            carousels.map((carousel) => (
              <ProductCarousel
                key={carousel.id}
                titulo={carousel.titulo}
                tipo={carousel.tipo}
                categoriaSlug={carousel.categoria_slug}
              />
            ))
          ) : (
            <ProductCarousel
              titulo="Mais Curtidos"
              tipo="mais_curtidos"
            />
          )
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/busca')}
            className="border border-vinho-400 text-gray-900 px-8 py-3 hover:bg-vinho-800 hover:text-white transition-colors text-sm tracking-wide cursor-pointer"
          >
            VER TODOS OS PRODUTOS
          </button>
        </div>
      </main>

      {/* Footer */}
      <Fuuter />

    </div>
  );
}

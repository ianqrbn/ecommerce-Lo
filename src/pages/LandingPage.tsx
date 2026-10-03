import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ProductCarousel } from '../components/ProductCarousel';
import { Fuuter } from '../components/Fuuter';
import { CategoryShowcase } from '../components/CategoryShowcase';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Tag, Copy, Check } from 'lucide-react';

export default function LandingPage() {
  const [carousels, setCarousels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [cupons, setCupons] = useState<any[]>([]);
  // Estados para o banner rotativo de cupons
  const [currentCupomIndex, setCurrentCupomIndex] = useState(0);
  const [isCupomAnimating, setIsCupomAnimating] = useState(false);
  const [isCupomPaused, setIsCupomPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchCupons();
  }, []);

  const fetchCupons = async () => {
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCupons(data || []);
    } catch (err) {
      console.error('Erro ao buscar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Alternância automática entre cupons a cada 4.5 segundos
  useEffect(() => {
    if (cupons.length <= 1 || isCupomPaused) return;

    const interval = setInterval(() => {
      setIsCupomAnimating(true);
      setTimeout(() => {
        setCurrentCupomIndex((prev) => (prev + 1) % cupons.length);
        setIsCupomAnimating(false);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, [cupons.length, isCupomPaused]);

  const handlePrevCupom = () => {
    setIsCupomAnimating(true);
    setTimeout(() => {
      setCurrentCupomIndex((prev) => (prev - 1 + cupons.length) % cupons.length);
      setIsCupomAnimating(false);
    }, 200);
  };

  const handleNextCupom = () => {
    setIsCupomAnimating(true);
    setTimeout(() => {
      setCurrentCupomIndex((prev) => (prev + 1) % cupons.length);
      setIsCupomAnimating(false);
    }, 200);
  };

  const handleCopyCode = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiedCode(codigo);
    setTimeout(() => setCopiedCode(null), 2500);
  };

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
      {/* Banner com os cupons ativos */}
      {/* Banner rotativo de cupons ativos */}
      {cupons.length > 0 && (
        <div
          className="relative flex items-center justify-center px-4 py-2 bg-vinho-900 border-t border-vinho-400/60 font-serif w-full transition-all duration-300 overflow-hidden select-none"
          onMouseEnter={() => setIsCupomPaused(true)}
          onMouseLeave={() => setIsCupomPaused(false)}
        >
          <div className="w-full mx-auto flex items-center justify-between">


            {/* Conteúdo Central com transição suave */}
            <div className="flex-1 flex items-center justify-center px-2">
              {(() => {
                const cupom = cupons[currentCupomIndex] || cupons[0];
                return (
                  <div
                    key={cupom.id}
                    className={`flex items-center justify-center flex-wrap gap-2 text-xs sm:text-sm text-white transition-all duration-300 transform ${isCupomAnimating
                      ? 'opacity-0 -translate-y-2 scale-95'
                      : 'opacity-100 translate-y-0 scale-100'
                      }`}
                  >
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-vinho-300 flex-shrink-0" />

                    {cupom.descricao && (
                      <span className="text-white/90 tracking-wide font-sans text-center">
                        {cupom.descricao}
                      </span>
                    )}

                    <span className="text-white/40 hidden sm:inline">•</span>

                    <div className="inline-flex items-center gap-1.5 font-sans">
                      <span className="text-white/80 hidden xs:inline text-xs">Cupom:</span>
                      <button
                        onClick={() => handleCopyCode(cupom.codigo)}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-vinho-800 hover:bg-vinho-700 border border-vinho-400 text-white font-mono font-semibold tracking-wider transition-all duration-200 cursor-pointer active:scale-95"
                        title="Clique para copiar o código"
                      >
                        <span>{cupom.codigo}</span>
                        {copiedCode === cupom.codigo ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
                        )}
                      </button>

                      {copiedCode === cupom.codigo && (
                        <span className="text-white text-xs font-medium">
                          Copiado!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>


          </div>
        </div>
      )}

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

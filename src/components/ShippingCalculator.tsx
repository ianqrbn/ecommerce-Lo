import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Truck, Search, Loader2 } from 'lucide-react';

interface ShippingOption {
  id: number;
  name: string;
  company: string;
  price: string;
  delivery_time: number;
  picture: string;
}

interface ShippingCalculatorProps {
  items: Array<{ id: string; quantity: number }>;
  initialCep?: string;
  autoCalculate?: boolean;
  onSelectOption?: (option: ShippingOption) => void;
  selectedOptionId?: number;
}

export function ShippingCalculator({ items, initialCep, autoCalculate, onSelectOption, selectedOptionId }: ShippingCalculatorProps) {
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCep !== undefined) {
      setCep(initialCep);
      const raw = initialCep.replace(/\D/g, '');
      if (autoCalculate && raw.length === 8 && items.length > 0) {
        const timer = setTimeout(() => {
          handleCalculate(raw);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [initialCep, autoCalculate, items]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setCep(value);
  };

  const handleCalculate = async (cepOverride?: string) => {
    const targetCep = typeof cepOverride === 'string' ? cepOverride : cep;
    const rawCep = targetCep.replace(/\D/g, '');
    if (rawCep.length !== 8) {
      setError('CEP inválido. Digite 8 números.');
      return;
    }

    if (items.length === 0) {
      setError('Nenhum item para calcular.');
      return;
    }

    setLoading(true);
    setError('');
    setOptions([]);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          cep_destino: rawCep,
          items: items
        }
      });

      if (invokeError) throw invokeError;

      if (data && Array.isArray(data)) {
        // Ordena por preço crescente
        const sortedOptions = data.sort((a, b) => Number(a.price) - Number(b.price));
        setOptions(sortedOptions);
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Formato de resposta inválido');
      }
    } catch (err: any) {
      console.error("Erro ao calcular frete:", err);
      setError(err.message || 'Erro ao calcular o frete. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="w-5 h-5 text-gray-700" />
        <h3 className="font-medium text-gray-900">Calcular Frete e Prazo</h3>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={cep}
          onChange={handleCepChange}
          placeholder="00000-000"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-vinho-500 focus:ring-1 focus:ring-vinho-500"
        />
        <button
          onClick={() => handleCalculate()}
          disabled={loading || cep.length < 9}
          className="bg-vinho-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-vinho-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calcular'}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noreferrer" className="text-xs text-vinho-700 hover:underline">
          Não sei meu CEP
        </a>
      </div>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded">
          {error}
        </div>
      )}

      {options.length > 0 && (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Opções de entrega:</p>
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => onSelectOption && onSelectOption(option)}
              className={`flex items-center justify-between bg-white p-3 border rounded text-sm ${onSelectOption ? 'cursor-pointer hover:border-vinho-500 transition-colors' : 'border-gray-200'
                } ${selectedOptionId === option.id ? 'border-vinho-700 bg-vinho-50 ring-1 ring-vinho-700' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-3">
                {option.picture && (
                  <img src={option.picture} alt={option.company} className="w-8 h-8 object-contain" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{option.name}</p>
                  <p className="text-gray-500 text-xs">Até {option.delivery_time} {option.delivery_time === 1 ? 'dia útil' : 'dias úteis'}</p>
                </div>
              </div>
              <div className="font-medium text-gray-900">
                R$ {Number(option.price).toFixed(2).replace('.', ',')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

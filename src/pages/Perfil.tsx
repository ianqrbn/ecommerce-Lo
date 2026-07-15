import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';
import { User, Mail, Phone, Hash, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Perfil() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  // Carrega os dados iniciais do perfil
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (profile) {
      setNome(profile.nome || '');
      setCpf(profile.cpf || '');
      setTelefone(profile.telefone || '');
    }
  }, [user, profile, navigate]);

  // Função simples para aplicar máscara no CPF (apenas formatação visual básica)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica máscara: 000.000.000-00
    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
    }
    setCpf(value);
  };

  // Função simples para aplicar máscara no telefone (apenas formatação visual básica)
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica máscara: (00) 00000-0000
    if (value.length > 10) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    setTelefone(value);
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: nome,
          cpf: cpf,
          telefone: telefone
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      await refreshProfile(); // Atualiza o perfil no contexto global
      setStatus({ type: 'success', message: 'Perfil atualizado com sucesso!' });
      
      // Limpa a mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000);
      
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setStatus({ type: 'error', message: err.message || 'Erro ao atualizar o perfil. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex justify-center items-center">
          <span className="text-gray-400">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-gray-900 mb-2">Meu Perfil</h1>
            <p className="text-gray-500">Gerencie suas informações pessoais e de contato.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
            
            {status.type && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                <p className="text-sm font-medium">{status.message}</p>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* E-mail (Somente leitura pois a mudança exige confirmação especial no Supabase Auth) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Login)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed outline-none"
                    value={profile.email || ''}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">O e-mail não pode ser alterado por aqui.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 outline-none transition"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <Hash className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 outline-none transition"
                      value={cpf}
                      onChange={handleCpfChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / Celular</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                      <Phone className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 outline-none transition"
                      value={telefone}
                      onChange={handleTelefoneChange}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-vinho-700 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-vinho-800 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

      <Fuuter />
    </div>
  );
}

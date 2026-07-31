import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Fuuter } from '../components/Fuuter';
import { User, Mail, Phone, Hash, Save, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Package } from 'lucide-react';

export default function Perfil() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const [activeTab, setActiveTab] = useState<'dados' | 'pedidos'>('dados');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  // Carrega os dados iniciais do perfil e os pedidos
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

    // Busca pedidos
    const fetchPedidos = async () => {
      setLoadingPedidos(true);
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select(`
            *,
            enderecos!inner ( usuario_id ),
            itens_pedido (
              quantidade,
              preco_unitario,
              produtos (
                nome,
                imagem_principal
              )
            )
          `)
          .eq('enderecos.usuario_id', user.id)
          .order('data_pedido', { ascending: false });
        
        if (!error && data) {
          setPedidos(data);
        }
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      } finally {
        setLoadingPedidos(false);
      }
    };
    
    fetchPedidos();
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

  // Helper para formatar status do pedido
  const formatStatus = (status: string) => {
    switch(status) {
      case 'pendente': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pendente</span>;
      case 'pago': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Pago</span>;
      case 'cancelado': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Cancelado</span>;
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Aprovado</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4 pt-32">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-gray-900 mb-2">Minha Conta</h1>
            <p className="text-gray-500">Gerencie suas informações e acompanhe seus pedidos.</p>
          </div>

          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('dados')}
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'dados' ? 'border-vinho-700 text-vinho-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Dados Pessoais
            </button>
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`pb-4 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pedidos' ? 'border-vinho-700 text-vinho-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Meus Pedidos
            </button>
          </div>

          {activeTab === 'dados' ? (
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
          ) : (
            <div className="space-y-4">
              {loadingPedidos ? (
                <div className="text-center py-8 text-gray-500">Carregando pedidos...</div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-gray-500 mb-4">Você ainda não tem nenhum pedido.</p>
                  <button onClick={() => navigate('/')} className="text-vinho-700 font-medium hover:underline">
                    Começar a comprar
                  </button>
                </div>
              ) : (
                pedidos.map((pedido) => (
                  <div key={pedido.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all">
                    {/* Cabeçalho do Pedido (Sempre Visível) */}
                    <div 
                      className="p-6 flex flex-wrap justify-between items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleOrderExpand(pedido.id)}
                    >
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Pedido #{pedido.id.toString().padStart(4, '0')}</p>
                        <p className="text-gray-900 font-medium">
                          {new Date(pedido.data_pedido).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {formatStatus(pedido.status)}
                        <p className="font-bold text-gray-900">R$ {pedido.total.toFixed(2).replace('.', ',')}</p>
                      </div>
                      
                      <div className="w-full flex justify-center mt-2 md:mt-0 md:w-auto md:ml-4">
                        <button className="text-gray-400 hover:text-vinho-700 transition-colors flex items-center gap-1 text-sm font-medium">
                          {expandedOrder === pedido.id ? (
                            <>Recolher <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>Detalhes <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Detalhes do Pedido (Expandível) */}
                    {expandedOrder === pedido.id && (
                      <div className="border-t border-gray-100 bg-gray-50 p-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Package className="w-4 h-4 text-vinho-700" /> Itens do Pedido
                        </h4>
                        
                        {pedido.itens_pedido && pedido.itens_pedido.length > 0 ? (
                          <div className="space-y-4">
                            {pedido.itens_pedido.map((item: any, index: number) => (
                              <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-100">
                                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                  <img 
                                    src={item.produtos?.imagem_principal || 'https://via.placeholder.com/150'} 
                                    alt={item.produtos?.nome || 'Produto'} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.produtos?.nome || 'Produto Indisponível'}</p>
                                  <p className="text-xs text-gray-500 mt-1">Quantidade: {item.quantidade}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">R$ {Number(item.preco_unitario).toFixed(2).replace('.', ',')}</p>
                                </div>
                              </div>
                            ))}
                            
                            <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-200 mt-4 px-2">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="text-gray-900 font-medium">R$ {Number(pedido.subtotal).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm px-2">
                              <span className="text-gray-600">Frete</span>
                              <span className="text-gray-900 font-medium">R$ {Number(pedido.frete).toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Nenhum item encontrado para este pedido.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <Fuuter />
    </div>
  );
}

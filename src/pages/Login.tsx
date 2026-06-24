import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Lock } from 'lucide-react'; // Usando lucide-react para padronizar
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');

  const handleAuth = async (e) => {
  e.preventDefault();
  setLoading(true);

  if (isSignUp) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome: nome }
      }
    });
    if (error) alert(error.message);
    else alert('Verifique seu e-mail para confirmar o cadastro!');
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      // Redireciona para a rota correspondente à Landing Page (geralmente '/')
      navigate('/'); 
    }
  }
  
  setLoading(false);
};

  return (
    // Fundo cinza super claro para destacar o card branco
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      
      <div className="w-full max-w-md p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif text-gray-900 mb-2">
            {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-sm text-gray-500">
            {isSignUp ? 'Junte-se a nós e descubra coleções exclusivas.' : 'Acesse sua conta para continuar.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {isSignUp && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Nome completo"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 outline-none transition"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          )}

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Mail className="w-5 h-5" />
            </span>
            <input
              type="email"
              placeholder="E-mail"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type="password"
              placeholder="Senha"
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-vinho-700 focus:border-vinho-700 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            // Botão é o grande ponto de destaque visual
            className="w-full bg-vinho-700 text-white py-3 rounded-lg font-medium hover:bg-vinho-800 transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Processando...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          {!isSignUp && (
            <button className="text-sm text-gray-500 hover:text-vinho-700 transition">
              Esqueceu sua senha?
            </button>
          )}
          <p className="text-sm text-gray-600 border-t border-gray-100 pt-6">
            {isSignUp ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-vinho-700 font-medium hover:text-vinho-800 transition"
            >
              {isSignUp ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
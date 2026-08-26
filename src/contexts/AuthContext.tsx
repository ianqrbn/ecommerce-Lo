import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UsuarioPerfil {
  id: string;
  email: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  data_criacao: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UsuarioPerfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' && currentUser) {
          // Perfil ainda não existe na tabela public.usuarios, tenta criar
          console.log('Perfil não encontrado na tabela public.usuarios, criando...');
          const email = currentUser.email || '';
          const nome = currentUser.user_metadata?.nome || currentUser.user_metadata?.full_name || email.split('@')[0];

          const { data: newData, error: insertError } = await supabase
            .from('usuarios')
            .insert([{ id: userId, email, nome }])
            .select()
            .single();

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            // Se a RLS falhar ao inserir, criamos um perfil em memória para não travar o usuário
            setProfile({
              id: userId,
              email,
              nome,
              data_criacao: new Date().toISOString(),
              is_admin: false
            });
          } else {
            setProfile({ ...newData, is_admin: false });
          }
        } else {
          console.error('Erro ao buscar perfil:', error);
          setProfile(null);
        }
      } else {
        // Verifica se o usuário é administrador
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (adminError) {
          console.error('Erro ao verificar admin_users:', adminError);
        }

        console.log('[AuthContext] Verificando admin para o user_id:', userId);
        console.log('[AuthContext] Resultado da tabela admin_users:', adminData);

        setProfile({ ...data, is_admin: !!adminData });
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  };

  // Busca do perfil sempre que o 'user' mudar
  useEffect(() => {
    if (user) {
      setLoading(true); // Garante que a tela de loading volte a aparecer enquanto busca o perfil
      console.log('[AuthContext] Usuário alterado, buscando perfil...');
      fetchProfile(user.id, user).finally(() => {
        setLoading(false);
      });
    } else {
      setProfile(null);
      // Não mudamos o loading aqui porque o getSession e onAuthStateChange já cuidam disso
    }
  }, [user]);

  useEffect(() => {
    console.log('[AuthContext] Montando contexto de autenticação...');
    let isMounted = true;

    // Apenas atualiza o state do usuário
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AuthContext] getSession() retornou!', { session, error });
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      if (!currentUser) {
        setLoading(false); // Se não tiver usuário, já pode tirar o loading
      }
      setUser(currentUser);
    });

    console.log('[AuthContext] Configurando onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] onAuthStateChange disparou!', event);
      if (!isMounted) return;

      const currentUser = session?.user ?? null;
      if (!currentUser) {
        setLoading(false);
      }
      setUser(currentUser);
    });

    return () => {
      console.log('[AuthContext] Desmontando contexto...');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

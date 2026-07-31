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
            setProfile(null);
          } else {
            setProfile(newData);
          }
        } else {
          console.error('Erro ao buscar perfil:', error);
          setProfile(null);
        }
      } else {
        setProfile(data);
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
      console.log('[AuthContext] Usuário alterado, buscando perfil...');
      fetchProfile(user.id, user).finally(() => {
        setLoading(false);
      });
    } else {
      setProfile(null);
      setLoading(false);
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

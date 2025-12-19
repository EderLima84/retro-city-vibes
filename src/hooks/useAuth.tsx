import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName: string, inviteCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          display_name: displayName,
          invite_code: inviteCode
        }
      }
    });

    // Se o cadastro foi bem-sucedido e há um código de convite, processar o convite
    if (!error && data.user && inviteCode) {
      try {
        await processInviteCode(inviteCode, data.user.id);
      } catch (inviteError) {
        console.error('Erro ao processar código de convite:', inviteError);
        // Não falha o cadastro se houver erro no convite
      }
    }

    return { error, user: data.user };
  };

  const processInviteCode = async (code: string, newUserId: string) => {
    try {
      // Por enquanto, apenas validar o formato do código
      if (!code || !code.startsWith('ORK-')) {
        throw new Error('Código de convite inválido');
      }

      // Simular processamento bem-sucedido
      console.log('Código de convite processado:', code, 'para usuário:', newUserId);
      
      // Dar pontos bônus para o novo usuário
      await supabase
        .from('profiles')
        .update({ points: 100 }) // 100 pontos bônus por usar convite
        .eq('id', newUserId);

    } catch (error) {
      console.error('Erro ao processar convite:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      navigate('/dashboard');
    }
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
};

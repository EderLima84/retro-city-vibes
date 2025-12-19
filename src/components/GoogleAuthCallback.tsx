import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const GoogleAuthCallback = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [needsProfile, setNeedsProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (error || !profile?.username) {
        // Usuário precisa completar o perfil
        setNeedsProfile(true);
        // Sugerir username baseado no email
        const emailUsername = user.email?.split('@')[0] || '';
        setUsername(emailUsername);
      } else {
        // Perfil já existe, redirecionar
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
      setNeedsProfile(true);
    } finally {
      setChecking(false);
    }
  };

  const completeProfile = async () => {
    if (!user || !username.trim()) {
      toast.error('Nome de usuário é obrigatório');
      return;
    }

    setLoading(true);
    try {
      // Verificar se username já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .single();

      if (existingUser) {
        toast.error('Nome de usuário já existe. Escolha outro.');
        setLoading(false);
        return;
      }

      // Criar/atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim(),
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          avatar_url: user.user_metadata?.avatar_url || null,
          email: user.email,
        });

      if (error) throw error;

      toast.success('Perfil criado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      toast.error('Erro ao criar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Configurando sua conta...</p>
        </div>
      </div>
    );
  }

  if (!needsProfile) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete seu Perfil</CardTitle>
          <p className="text-muted-foreground">
            Escolha um nome de usuário para finalizar seu cadastro
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              type="text"
              placeholder="seunome"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              Apenas letras, números e _ são permitidos
            </p>
          </div>

          <Button
            onClick={completeProfile}
            className="w-full"
            disabled={loading || !username.trim()}
          >
            {loading ? 'Criando perfil...' : 'Finalizar Cadastro'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
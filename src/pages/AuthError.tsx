import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function AuthError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fixing, setFixing] = useState(false);
  
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    // Se chegou aqui com erro de database, tentar criar perfil manualmente
    if (errorCode === 'unexpected_failure' && errorDescription?.includes('Database error')) {
      fixDatabaseError();
    }
  }, [errorCode, errorDescription]);

  const fixDatabaseError = async () => {
    setFixing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Verificar se perfil já existe
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Criar perfil manualmente
          const emailUsername = user.email?.split('@')[0] || 'user';
          const randomSuffix = Math.floor(Math.random() * 10000);
          const username = `${emailUsername}${randomSuffix}`;

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: username,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
              avatar_url: user.user_metadata?.avatar_url || null,
              email: user.email,
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', profileError);
            toast.error('Erro ao criar perfil. Tente novamente.');
          } else {
            toast.success('Perfil criado com sucesso!');
            navigate('/dashboard');
            return;
          }
        } else {
          // Perfil já existe, redirecionar
          navigate('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao corrigir problema:', error);
      toast.error('Erro ao corrigir problema.');
    } finally {
      setFixing(false);
    }
  };

  const getErrorMessage = () => {
    if (errorCode === 'unexpected_failure' && errorDescription?.includes('Database error')) {
      return {
        title: 'Erro na Criação do Perfil',
        description: 'Houve um problema ao criar seu perfil. Estamos tentando corrigir automaticamente.',
        canFix: true
      };
    }
    
    return {
      title: 'Erro de Autenticação',
      description: errorDescription || 'Ocorreu um erro durante o login.',
      canFix: false
    };
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            {errorInfo.description}
          </p>
          
          {fixing && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Corrigindo problema...</span>
            </div>
          )}

          <div className="space-y-2">
            {errorInfo.canFix && !fixing && (
              <Button 
                onClick={fixDatabaseError}
                className="w-full"
              >
                Tentar Corrigir
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded text-xs">
              <strong>Debug Info:</strong><br />
              Error: {error}<br />
              Code: {errorCode}<br />
              Description: {errorDescription}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
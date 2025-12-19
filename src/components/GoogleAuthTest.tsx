import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const GoogleAuthTest = () => {
  const testSupabaseConnection = async () => {
    try {
      console.log('🔍 Testando conexão Supabase...');
      
      const { data, error } = await supabase.auth.getSession();
      console.log('Sessão atual:', data);
      if (error) {
        console.error('Erro na sessão:', error);
      } else {
        console.log('✅ Conexão Supabase OK');
      }
      
    } catch (error) {
      console.error('Erro no teste:', error);
    }
  };

  const testGoogleOAuth = async () => {
    try {
      console.log('🔍 Testando Google OAuth...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('❌ Erro no Google OAuth:', error);
        alert(`Erro: ${error.message}`);
      } else {
        console.log('✅ Google OAuth iniciado com sucesso');
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      alert(`Erro inesperado: ${error}`);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>🧪 Teste Google OAuth</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testSupabaseConnection}
          variant="outline"
          className="w-full"
        >
          Testar Conexão Supabase
        </Button>
        
        <Button 
          onClick={testGoogleOAuth}
          className="w-full"
        >
          Testar Google OAuth
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Abra o DevTools (F12) para ver os logs detalhados
        </div>
      </CardContent>
    </Card>
  );
};
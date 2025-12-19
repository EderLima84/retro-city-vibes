import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  Share2, 
  Copy, 
  Users, 
  Gift, 
  Trophy,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  UserPlus,
  Crown,
  Star
} from 'lucide-react';

interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  used_count: number;
  max_uses: number;
  expires_at: string | null;
  is_active: boolean;
}

interface InviteStats {
  total_invites: number;
  successful_invites: number;
  pending_invites: number;
  reward_points: number;
}

export const InviteSystem: React.FC = () => {
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [stats, setStats] = useState<InviteStats>({
    total_invites: 0,
    successful_invites: 0,
    pending_invites: 0,
    reward_points: 0
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadInviteData();
    }
  }, [user]);

  const loadInviteData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Por enquanto, simular dados até as tabelas serem criadas
      const mockCode: InviteCode = {
        id: '1',
        code: `ORK-${user.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        created_at: new Date().toISOString(),
        used_count: 0,
        max_uses: 10,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };

      setInviteCode(mockCode);
      setStats({
        total_invites: 0,
        successful_invites: 0,
        pending_invites: 0,
        reward_points: 0
      });

    } catch (error) {
      console.error('Erro ao carregar dados de convite:', error);
      toast.error('Erro ao carregar dados de convite');
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    if (!user) return;

    try {
      setGenerating(true);

      // Gerar novo código único
      const newCode = `ORK-${user.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      const mockCode: InviteCode = {
        id: Date.now().toString(),
        code: newCode,
        created_at: new Date().toISOString(),
        used_count: 0,
        max_uses: 10,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };

      setInviteCode(mockCode);
      toast.success('✨ Novo código de convite gerado!');

    } catch (error) {
      console.error('Erro ao gerar código:', error);
      toast.error('Erro ao gerar código de convite');
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    
    navigator.clipboard.writeText(inviteCode.code);
    toast.success('📋 Código copiado!');
  };

  const shareViaWhatsApp = () => {
    if (!inviteCode || !user) return;

    const inviteUrl = `${window.location.origin}/auth?invite=${inviteCode.code}`;
    const message = `🎉 Você foi convidado para a Orkadia!

🏠 Uma rede social nostálgica inspirada no Orkut
👥 Conecte-se com pessoas reais
🎯 Participe de clubes incríveis
🎨 Personalize sua casa virtual

🔗 Use meu código de convite: ${inviteCode.code}
📱 Ou acesse diretamente: ${inviteUrl}

Venha fazer parte da nossa comunidade! 🚀`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareInviteLink = () => {
    if (!inviteCode) return;

    const inviteUrl = `${window.location.origin}/auth?invite=${inviteCode.code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success('🔗 Link de convite copiado!');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-orkut rounded-full">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sistema de Convites</CardTitle>
          <CardDescription>
            Convide amigos para a Orkadia e ganhe recompensas especiais!
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <Users className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{stats.successful_invites}</p>
          <p className="text-xs text-muted-foreground">Convites Aceitos</p>
        </Card>
        <Card className="text-center p-4">
          <Star className="w-6 h-6 text-secondary mx-auto mb-2" />
          <p className="text-2xl font-bold text-secondary">{stats.reward_points}</p>
          <p className="text-xs text-muted-foreground">Pontos Ganhos</p>
        </Card>
        <Card className="text-center p-4">
          <Trophy className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-accent">{Math.floor(stats.successful_invites / 5)}</p>
          <p className="text-xs text-muted-foreground">Conquistas</p>
        </Card>
        <Card className="text-center p-4">
          <Crown className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-600">
            {stats.successful_invites >= 10 ? 'VIP' : stats.successful_invites >= 5 ? 'PRO' : 'NOVO'}
          </p>
          <p className="text-xs text-muted-foreground">Status</p>
        </Card>
      </div>

      {/* Código de Convite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Seu Código de Convite
          </CardTitle>
          <CardDescription>
            Compartilhe este código único com seus amigos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteCode ? (
            <>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteCode.code}
                  readOnly
                  className="font-mono text-lg text-center bg-muted"
                />
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  Usos: {inviteCode.used_count}/{inviteCode.max_uses}
                </Badge>
                <Badge variant="outline">
                  Expira: {new Date(inviteCode.expires_at!).toLocaleDateString('pt-BR')}
                </Badge>
                <Badge variant={inviteCode.is_active ? "default" : "destructive"}>
                  {inviteCode.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button onClick={shareViaWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={shareInviteLink} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Copiar Link
                </Button>
                <Button variant="outline" onClick={generateInviteCode} disabled={generating} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  Novo Código
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Você ainda não tem um código de convite
              </p>
              <Button onClick={generateInviteCode} disabled={generating} className="gap-2">
                <Gift className="w-4 h-4" />
                {generating ? 'Gerando...' : 'Gerar Código'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recompensas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-secondary" />
            Sistema de Recompensas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Por cada convite aceito</p>
                  <p className="text-sm text-muted-foreground">Quando alguém se cadastra com seu código</p>
                </div>
              </div>
              <Badge variant="secondary">+50 pontos</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium">5 convites aceitos</p>
                  <p className="text-sm text-muted-foreground">Conquista "Embaixador"</p>
                </div>
              </div>
              <Badge variant="secondary">+200 pontos</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">10 convites aceitos</p>
                  <p className="text-sm text-muted-foreground">Status VIP + Badge especial</p>
                </div>
              </div>
              <Badge variant="secondary">+500 pontos</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
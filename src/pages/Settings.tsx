import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CityNavigation } from "@/components/CityNavigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Users, 
  Gift, 
  Settings as SettingsIcon,
  Shield,
  Palette,
  ArrowLeft,
  Save,
  Loader2
} from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";

interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  friendRequests: boolean;
  gifts: boolean;
  mentions: boolean;
  announcements: boolean;
}

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    likes: true,
    comments: true,
    friendRequests: true,
    gifts: true,
    mentions: true,
    announcements: true
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem(`notification_prefs_${user?.id}`);
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {
        console.error("Error loading preferences:", e);
      }
    }
  }, [user?.id]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage for now
      localStorage.setItem(`notification_prefs_${user?.id}`, JSON.stringify(preferences));
      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <CityNavigation />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-primary" />
              Configurações
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas preferências e notificações
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notificações
              </CardTitle>
              <CardDescription>
                Escolha quais notificações você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-4 h-4 text-red-500" />
                  <Label htmlFor="likes" className="cursor-pointer">
                    Curtidas
                    <p className="text-xs text-muted-foreground font-normal">
                      Notificar quando alguém curtir seus posts
                    </p>
                  </Label>
                </div>
                <Switch
                  id="likes"
                  checked={preferences.likes}
                  onCheckedChange={() => handleToggle('likes')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <Label htmlFor="comments" className="cursor-pointer">
                    Comentários
                    <p className="text-xs text-muted-foreground font-normal">
                      Notificar quando comentarem em seus posts
                    </p>
                  </Label>
                </div>
                <Switch
                  id="comments"
                  checked={preferences.comments}
                  onCheckedChange={() => handleToggle('comments')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-green-500" />
                  <Label htmlFor="friendRequests" className="cursor-pointer">
                    Solicitações de Amizade
                    <p className="text-xs text-muted-foreground font-normal">
                      Notificar quando receberem novas solicitações
                    </p>
                  </Label>
                </div>
                <Switch
                  id="friendRequests"
                  checked={preferences.friendRequests}
                  onCheckedChange={() => handleToggle('friendRequests')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-purple-500" />
                  <Label htmlFor="gifts" className="cursor-pointer">
                    Presentes
                    <p className="text-xs text-muted-foreground font-normal">
                      Notificar quando receber presentes
                    </p>
                  </Label>
                </div>
                <Switch
                  id="gifts"
                  checked={preferences.gifts}
                  onCheckedChange={() => handleToggle('gifts')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-orange-500" />
                  <Label htmlFor="mentions" className="cursor-pointer">
                    Menções
                    <p className="text-xs text-muted-foreground font-normal">
                      Notificar quando te mencionarem
                    </p>
                  </Label>
                </div>
                <Switch
                  id="mentions"
                  checked={preferences.mentions}
                  onCheckedChange={() => handleToggle('mentions')}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-yellow-500" />
                  <Label htmlFor="announcements" className="cursor-pointer">
                    Anúncios da Cidade
                    <p className="text-xs text-muted-foreground font-normal">
                      Notificar sobre novidades e anúncios
                    </p>
                  </Label>
                </div>
                <Switch
                  id="announcements"
                  checked={preferences.announcements}
                  onCheckedChange={() => handleToggle('announcements')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize o visual do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Tema</Label>
                <ThemeSelector />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Privacidade e Segurança
              </CardTitle>
              <CardDescription>
                Gerencie suas configurações de privacidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/privacy-settings')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Configurações de Privacidade
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Preferências
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Home, 
  MessageSquare, 
  Award, 
  Image as ImageIcon, 
  Music,
  Trophy,
  Send,
  Sparkles,
  Star,
  Heart
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Scrap = Tables<"scraps"> & {
  from_profile: Tables<"profiles">;
};
type Achievement = Tables<"user_achievements"> & {
  achievement: Tables<"achievements">;
};

const Profile = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newScrap, setNewScrap] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Carregar perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Carregar scraps
      const { data: scrapsData, error: scrapsError } = await supabase
        .from("scraps")
        .select(`
          *,
          from_profile:profiles!scraps_from_user_id_fkey(*)
        `)
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false });

      if (scrapsError) throw scrapsError;
      setScraps(scrapsData || []);

      // Carregar conquistas
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoadingData(false);
    }
  };

  const addScrap = async () => {
    if (!newScrap.trim() || !user) return;

    try {
      const { error } = await supabase
        .from("scraps")
        .insert({
          from_user_id: user.id,
          to_user_id: user.id,
          content: newScrap.trim(),
        });

      if (error) throw error;

      setNewScrap("");
      toast.success("✨ Recado adicionado!");
      loadProfileData();
    } catch (error) {
      console.error("Erro ao adicionar recado:", error);
      toast.error("Erro ao adicionar recado");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header da Casa */}
        <Card className="p-8 mb-8 shadow-elevated relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-orkut opacity-10" />
          <div className="relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-orkut flex items-center justify-center text-white text-4xl font-bold shadow-glow">
                {profile?.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile?.display_name}</h1>
                  <Badge variant="secondary" className="gap-1">
                    <Star className="w-3 h-3" />
                    Nível {profile?.level || 1}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2">@{profile?.username}</p>
                {profile?.bio && (
                  <p className="text-foreground mt-4">{profile.bio}</p>
                )}
                <div className="flex gap-4 mt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{profile?.points || 0}</p>
                    <p className="text-xs text-muted-foreground">Pontos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{achievements.length}</p>
                    <p className="text-xs text-muted-foreground">Conquistas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-secondary">{scraps.length}</p>
                    <p className="text-xs text-muted-foreground">Recados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Salas da Casa */}
        <Tabs defaultValue="living" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
            <TabsTrigger value="living" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Sala de Estar</span>
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Depoimentos</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Quarto</span>
            </TabsTrigger>
            <TabsTrigger value="trophies" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Troféus</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Música</span>
            </TabsTrigger>
          </TabsList>

          {/* Sala de Estar - Mural de Recados */}
          <TabsContent value="living" className="space-y-6">
            <Card className="p-6 shadow-card">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Mural de Recados
              </h3>
              <Textarea
                placeholder="Deixe um recado..."
                value={newScrap}
                onChange={(e) => setNewScrap(e.target.value)}
                className="mb-4"
              />
              <Button
                onClick={addScrap}
                disabled={!newScrap.trim()}
                className="bg-gradient-orkut hover:opacity-90"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Recado
              </Button>
            </Card>

            <div className="space-y-4">
              {loadingData ? (
                <Card className="p-8 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando recados...</p>
                </Card>
              ) : scraps.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhum recado ainda. Seja o primeiro!</p>
                </Card>
              ) : (
                scraps.map((scrap) => (
                  <Card key={scrap.id} className="p-4 shadow-card hover:shadow-elevated transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold text-sm">
                        {scrap.from_profile.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{scrap.from_profile.display_name}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(scrap.created_at!).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{scrap.content}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Depoimentos */}
          <TabsContent value="testimonials">
            <Card className="p-8 text-center shadow-card">
              <Award className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Depoimentos</h3>
              <p className="text-muted-foreground">
                🚧 Sistema de depoimentos em breve! Seus amigos poderão deixar mensagens especiais sobre você.
              </p>
            </Card>
          </TabsContent>

          {/* Galeria - Quarto */}
          <TabsContent value="gallery">
            <Card className="p-8 text-center shadow-card">
              <ImageIcon className="w-16 h-16 text-accent mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Galeria de Momentos</h3>
              <p className="text-muted-foreground">
                🚧 Em breve você poderá criar álbuns de fotos e vídeos personalizados!
              </p>
            </Card>
          </TabsContent>

          {/* Sala de Troféus */}
          <TabsContent value="trophies">
            <Card className="p-6 shadow-card">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Sala de Troféus
              </h3>
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">
                    Nenhuma conquista ainda. Continue interagindo para desbloquear troféus!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {achievements.map((userAchievement) => (
                    <Card key={userAchievement.id} className="p-4 text-center hover:shadow-elevated transition-shadow">
                      <div className="text-4xl mb-2">{userAchievement.achievement.icon || "🏆"}</div>
                      <h4 className="font-semibold text-sm mb-1">{userAchievement.achievement.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {userAchievement.achievement.description}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        +{userAchievement.achievement.points} pts
                      </Badge>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Sala de Música */}
          <TabsContent value="music">
            <Card className="p-8 text-center shadow-card">
              <Music className="w-16 h-16 text-secondary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Player de Música</h3>
              <p className="text-muted-foreground mb-4">
                🚧 Em breve! Escolha uma música para tocar quando visitarem sua casa.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="w-4 h-4" />
                <span>Nostalgia do player do perfil está voltando!</span>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;

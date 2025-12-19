import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Gift, Mail, Award, Trophy, Music, Users } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { FriendshipCircle } from "@/components/FriendshipCircle";
import { WallMessages } from "@/components/WallMessages";
import { ReceivedGifts } from "@/components/ReceivedGifts";
import { GiftDialog } from "@/components/GiftDialog";
import { ChatDialog } from "@/components/ChatDialog";
import { FriendshipLevelBadge } from "@/components/FriendshipLevel";
import { AffinityScore } from "@/components/AffinityScore";

type ProfileData = Tables<"profiles">;
type UserAchievement = Tables<"user_achievements"> & {
  achievement: Tables<"achievements">;
};

type FriendshipData = {
  level: string;
  affinity_score: number;
};

const PublicProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [friendship, setFriendship] = useState<FriendshipData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  useEffect(() => {
    if (user && userId) {
      if (user.id === userId) {
        navigate("/dashboard");
        return;
      }
      loadProfileData();
      loadFriendshipStatus();
    }
  }, [user, userId]);

  const loadProfileData = async () => {
    if (!userId) return;

    try {
      setLoadingData(true);

      // Carregar perfil
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Carregar conquistas
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (achievementsError) {
        console.warn("Erro ao carregar conquistas:", achievementsError);
      } else {
        setAchievements(achievementsData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoadingData(false);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!user || !userId) return;

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select("level, affinity_score")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setFriendship(data);
    } catch (error) {
      console.error("Erro ao carregar amizade:", error);
    }
  };

  const canChat = friendship?.level === "vizinho" || friendship?.level === "amigo_varanda";
  const canSendGift = !!friendship;

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-lg text-muted-foreground mb-4">Perfil não encontrado</p>
          <Button onClick={() => navigate("/explore")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Explorar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/explore")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Header do Perfil */}
        <Card className="mb-6 overflow-hidden">
          <div
            className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20"
            style={{
              backgroundImage: profile.house_background
                ? `url(${profile.house_background})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative -mt-20">
                <div className="w-32 h-32 rounded-full border-4 border-background bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary">
                      {profile.display_name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                  <Badge variant="secondary">@{profile.username}</Badge>
                  {friendship && (
                    <FriendshipLevelBadge level={friendship.level as any} showLabel />
                  )}
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold">{profile.points || 0}</span>
                    <span className="text-sm text-muted-foreground">pontos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Nível {profile.level || 1}</span>
                  </div>
                </div>

                {friendship && user && (
                  <div className="mb-4">
                    <AffinityScore userId={userId!} currentUserId={user.id} />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {canChat && (
                    <Button onClick={() => setChatDialogOpen(true)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </Button>
                  )}
                  {canSendGift && (
                    <Button variant="secondary" onClick={() => setGiftDialogOpen(true)}>
                      <Gift className="mr-2 h-4 w-4" />
                      Enviar Presente
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="trophies" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="trophies">
              <Trophy className="h-4 w-4 mr-2" />
              Troféus
            </TabsTrigger>
            <TabsTrigger value="friendships">
              <Users className="h-4 w-4 mr-2" />
              Amizades
            </TabsTrigger>
            <TabsTrigger value="wall">
              <Mail className="h-4 w-4 mr-2" />
              Mural
            </TabsTrigger>
            <TabsTrigger value="gifts">
              <Gift className="h-4 w-4 mr-2" />
              Presentes
            </TabsTrigger>
            <TabsTrigger value="music">
              <Music className="h-4 w-4 mr-2" />
              Música
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trophies">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-500" />
                Conquistas
              </h2>
              {achievements.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma conquista ainda
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {achievements.map((userAchievement) => (
                    <Card key={userAchievement.id} className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{userAchievement.achievement.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            {userAchievement.achievement.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {userAchievement.achievement.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              +{userAchievement.achievement.points} pontos
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(userAchievement.earned_at!).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="friendships">
            <FriendshipCircle userId={userId!} />
          </TabsContent>

          <TabsContent value="wall">
            <WallMessages userId={userId!} isOwner={false} />
          </TabsContent>

          <TabsContent value="gifts">
            <ReceivedGifts userId={userId!} isOwner={false} />
          </TabsContent>

          <TabsContent value="music">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Music className="h-6 w-6 text-primary" />
                Música da Casa
              </h2>
              {profile.house_music ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Ouça a música que toca na casa de {profile.display_name}:
                  </p>
                  <audio controls className="w-full">
                    <source src={profile.house_music} />
                    Seu navegador não suporta o elemento de áudio.
                  </audio>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {profile.display_name} ainda não adicionou uma música
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {canSendGift && (
        <GiftDialog
          isOpen={giftDialogOpen}
          onClose={() => setGiftDialogOpen(false)}
          recipientId={userId!}
          recipientName={profile.display_name}
        />
      )}

      {canChat && (
        <ChatDialog
          isOpen={chatDialogOpen}
          onClose={() => setChatDialogOpen(false)}
          recipientId={userId!}
          recipientName={profile.display_name}
          recipientAvatar={profile.avatar_url || undefined}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};

export default PublicProfile;

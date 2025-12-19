import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users, MessageSquare, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { CityNavigation } from "@/components/CityNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleGamification } from "@/hooks/useSimpleGamification";

function ClubPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { trackActivity } = useSimpleGamification();
  const [club, setClub] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [postingLoading, setPostingLoading] = useState(false);

  useEffect(() => {
    if (clubId) {
      loadClubData();
    }
  }, [clubId]);

  const loadClubData = async () => {
    try {
      setLoading(true);
      

      
      // Carregar dados do clube
      const clubResponse = await supabase
        .from("communities")
        .select("*")
        .eq("id", clubId)
        .single();

      if (clubResponse.error) throw clubResponse.error;
      setClub(clubResponse.data);

      // Verificar se o usuário é membro
      const userResponse = await supabase.auth.getUser();
      if (userResponse.data.user) {
        const membershipResponse = await supabase
          .from("community_members")
          .select("*")
          .eq("community_id", clubId)
          .eq("user_id", userResponse.data.user.id)
          .single();

        setIsMember(!!membershipResponse.data);
      }

      // Carregar posts do clube (simulado por enquanto)
      setPosts([]);

      // Carregar membros do clube
      const membersResponse = await supabase
        .from("community_members")
        .select("user_id, role")
        .eq("community_id", clubId);

      if (membersResponse.data) {
        // Carregar perfis dos membros
        const memberIds = membersResponse.data.map((member: any) => member.user_id);
        const profilesResponse = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", memberIds);

        const profilesMap = new Map(profilesResponse.data?.map((profile: any) => [profile.id, profile]) || []);
        
        const formattedMembers = membersResponse.data.map((member: any) => ({
          id: member.user_id,
          username: profilesMap.get(member.user_id)?.username || "Usuário",
          avatar_url: profilesMap.get(member.user_id)?.avatar_url,
          joined_at: new Date().toISOString(),
          role: member.role
        }));
        
        setMembers(formattedMembers);
      }

    } catch (error) {
      console.error("Erro ao carregar dados do clube:", error);
      toast.error("Erro ao carregar clube");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !isMember) return;

    try {
      setPostingLoading(true);
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const insertResponse = await supabase
        .from("posts")
        .insert({
          content: newPost.trim(),
          user_id: userResponse.data.user.id,
          club_id: clubId,
        });

      if (insertResponse.error) throw insertResponse.error;

      setNewPost("");
      toast.success("Post criado com sucesso!");
      loadClubData(); // Recarregar posts
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao criar post");
    } finally {
      setPostingLoading(false);
    }
  };

  const toggleMembership = async () => {
    try {
      const userResponse = await supabase.auth.getUser();
      if (!userResponse.data.user) {
        toast.error("Você precisa estar logado");
        return;
      }

      if (isMember) {
        const deleteResponse = await supabase
          .from("community_members")
          .delete()
          .eq("community_id", clubId)
          .eq("user_id", userResponse.data.user.id);

        if (deleteResponse.error) throw deleteResponse.error;
        toast.success("Você saiu do clube");
        setIsMember(false);
      } else {
        const insertResponse = await supabase
          .from("community_members")
          .insert({
            community_id: clubId,
            user_id: userResponse.data.user.id,
            role: "member",
          });

        if (insertResponse.error) throw insertResponse.error;
        
        // 🎮 GAMIFICAÇÃO: Rastrear entrada no clube
        trackActivity.clubJoined();
        
        toast.success("Você entrou no clube! +50 XP");
        setIsMember(true);
      }

      loadClubData(); // Recarregar dados
    } catch (error) {
      console.error("Erro ao atualizar inscrição:", error);
      toast.error("Erro ao atualizar inscrição");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <CityNavigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto text-center p-8">
            <CardHeader>
              <CardTitle>Clube não encontrado</CardTitle>
              <CardDescription>
                O clube que você está procurando não existe ou foi removido.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/clubs")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar aos Clubes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <CityNavigation />
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header do Clube */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/clubs")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Clubes
          </Button>

          <Card className="bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-orkut rounded-xl shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl">{club.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {club.category}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-base mb-4">
                    {club.description}
                  </CardDescription>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{members.length} membros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{posts.length} posts</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isMember ? "outline" : "default"}
                    onClick={toggleMembership}
                  >
                    {isMember ? "Sair do Clube" : "Entrar no Clube"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed de Posts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário de Post (apenas para membros) */}
            {isMember && (
              <Card className="bg-card/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Compartilhar no clube</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="O que você gostaria de compartilhar com o clube?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPost.trim() || postingLoading}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {postingLoading ? "Postando..." : "Postar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Posts */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <Card className="bg-card/95 backdrop-blur-sm p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
                  <p className="text-muted-foreground">
                    {isMember 
                      ? "Seja o primeiro a compartilhar algo neste clube!" 
                      : "Entre no clube para ver e criar posts."}
                  </p>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="bg-card/95 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback>
                            {post.profiles?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{post.profiles?.username || "Usuário"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Heart className="w-4 h-4" />
                          <span>{post._count?.likes || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post._count?.comments || 0}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Membros */}
          <div className="space-y-6">
            <Card className="bg-card/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Membros ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === "admin" ? "Admin" : "Membro"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ClubPage;
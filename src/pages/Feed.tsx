import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Cake, 
  Trophy, 
  Heart, 
  Star, 
  Sparkles, 
  MessageCircle,
  Send,
  Image as ImageIcon
} from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Post = Tables<"posts"> & {
  profiles: Tables<"profiles">;
};

const emotes = [
  { icon: Heart, label: "Coração", color: "text-red-500" },
  { icon: Star, label: "Estrela", color: "text-yellow-500" },
  { icon: Sparkles, label: "Brilho", color: "text-purple-500" },
  { icon: Cake, label: "Bolo", color: "text-pink-500" },
  { icon: Trophy, label: "Troféu", color: "text-amber-500" },
];

const Feed = () => {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles (*)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoadingPosts(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: newPostContent.trim(),
        });

      if (error) throw error;

      setNewPostContent("");
      toast.success("✨ Post criado! +2 pontos de cidadania");
      loadPosts();
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast.error("Erro ao criar post");
    } finally {
      setSubmitting(false);
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
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Coreto Digital */}
        <Card className="p-6 mb-8 shadow-elevated border-2 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-orkut bg-clip-text text-transparent">
              Coreto Digital
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/5 rounded-lg p-4 hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Cake className="w-5 h-5 text-pink-500" />
                <p className="font-semibold text-sm">Aniversariantes</p>
              </div>
              <p className="text-xs text-muted-foreground">0 pessoas fazendo aniversário hoje</p>
            </div>
            <div className="bg-accent/5 rounded-lg p-4 hover:bg-accent/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <p className="font-semibold text-sm">Conquistas</p>
              </div>
              <p className="text-xs text-muted-foreground">Nenhuma conquista recente</p>
            </div>
            <div className="bg-secondary/5 rounded-lg p-4 hover:bg-secondary/10 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <p className="font-semibold text-sm">Em Alta</p>
              </div>
              <p className="text-xs text-muted-foreground">Seja o primeiro a postar!</p>
            </div>
          </div>
        </Card>

        {/* Criar Post */}
        <Card className="p-6 mb-8 shadow-card">
          <h3 className="font-semibold mb-4">O que está acontecendo na praça?</h3>
          <Textarea
            placeholder="Compartilhe algo com a comunidade..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="mb-4 min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" disabled>
              <ImageIcon className="w-4 h-4 mr-2" />
              Foto
            </Button>
            <Button
              onClick={createPost}
              disabled={!newPostContent.trim() || submitting}
              className="bg-gradient-orkut hover:opacity-90"
            >
              <Send className="w-4 h-4 mr-2" />
              Publicar
            </Button>
          </div>
        </Card>

        {/* Feed de Posts */}
        <div className="space-y-6">
          {loadingPosts ? (
            <Card className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando posts...</p>
            </Card>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum post ainda. Seja o primeiro a compartilhar algo!
              </p>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-6 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold">
                    {post.profiles.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{post.profiles.display_name}</h4>
                      <span className="text-xs text-muted-foreground">
                        @{post.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.created_at!).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                    
                    {/* Emotes e Interações */}
                    <div className="flex items-center gap-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        {emotes.slice(0, 3).map((emote, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="hover:scale-110 transition-transform"
                          >
                            <emote.icon className={`w-4 h-4 ${emote.color}`} />
                          </Button>
                        ))}
                        <span className="text-sm text-muted-foreground ml-2">
                          {post.likes_count || 0}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.comments_count || 0}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;

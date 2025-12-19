import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { useSimpleGamification } from "@/hooks/useSimpleGamification";

type Comment = Tables<"comments"> & {
  profiles: Tables<"profiles">;
};

type Reply = Tables<"comment_replies"> & {
  profiles: Tables<"profiles">;
};

interface CommentDialogProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentDialog = ({ postId, isOpen, onClose }: CommentDialogProps) => {
  const { trackActivity } = useSimpleGamification();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [repliesByComment, setRepliesByComment] = useState<Record<string, Reply[]>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:author_id (*)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments((data as unknown as Comment[]) || []);

      // Load replies for these comments
      const commentIds = (data || []).map((c) => c.id);
      if (commentIds.length > 0) {
        try {
          const { data: replies, error: repliesError } = await supabase
            .from("comment_replies")
            .select(`
              *,
              profiles:author_id (*)
            `)
            .in("comment_id", commentIds)
            .order("created_at", { ascending: true });

          if (!repliesError) {
            const grouped: Record<string, Reply[]> = {};
            (replies || []).forEach((r: any) => {
              const key = r.comment_id as string;
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(r as Reply);
            });
            setRepliesByComment(grouped);
          } else {
            setRepliesByComment({});
          }
        } catch (_) {
          setRepliesByComment({});
        }
      } else {
        setRepliesByComment({});
      }
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
      toast.error("Erro ao carregar comentários");
    } finally {
      setLoading(false);
    }
  };

  const createComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          author_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      
      // 🎮 GAMIFICAÇÃO: Rastrear comentário feito
      trackActivity.commentMade();
      
      toast.success("Comentário adicionado! +10 XP");
      loadComments();
    } catch (error) {
      console.error("Erro ao criar comentário:", error);
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmitting(false);
    }
  };

  const createReply = async (commentId: string) => {
    const text = (replyInputs[commentId] || "").trim();
    if (!text) return;
    setReplySubmitting((prev) => ({ ...prev, [commentId]: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("comment_replies")
        .insert({
          comment_id: commentId,
          user_id: user.id,
          author_id: user.id,
          content: text,
        });

      if (error) throw error;
      setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
      toast.success("Resposta adicionada!");
      // Reload replies for this comment
      const { data: replies, error: repliesError } = await supabase
        .from("comment_replies")
        .select(`
          *,
          profiles:author_id (*)
        `)
        .eq("comment_id", commentId)
        .order("created_at", { ascending: true });
      if (!repliesError) {
        setRepliesByComment((prev) => ({ ...prev, [commentId]: (replies as unknown as Reply[]) || [] }));
      }
    } catch (error) {
      console.error("Erro ao responder comentário:", error);
      toast.error("Respostas indisponíveis: configure a tabela comment_replies ou políticas");
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Comentários</DialogTitle>
          <DialogDescription>
            Converse com outros cidadãos. Seja gentil e respeitoso.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-orkut flex items-center justify-center text-white font-bold flex-shrink-0">
                    {comment.profiles.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{comment.profiles.display_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at!).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                    {/* Replies */}
                    <div className="mt-3 space-y-2">
                      {(repliesByComment[comment.id] || []).map((reply) => (
                        <div key={reply.id} className="flex gap-2 ml-8">
                          <div className="w-8 h-8 rounded-full bg-gradient-orkut flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {reply.profiles?.display_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 bg-background/60 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-xs">{reply.profiles?.display_name}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {reply.created_at ? new Date(reply.created_at).toLocaleDateString("pt-BR") : ""}
                              </span>
                            </div>
                            <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Reply input */}
                      <div className="flex gap-2 ml-8 pt-2">
                        <Textarea
                          placeholder="Responder..."
                          value={replyInputs[comment.id] || ""}
                          onChange={(e) => setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                          className="min-h-[40px] text-xs"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              createReply(comment.id);
                            }
                          }}
                        />
                        <Button
                          onClick={() => createReply(comment.id)}
                          disabled={!(replyInputs[comment.id] || '').trim() || !!replySubmitting[comment.id]}
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                createComment();
              }
            }}
          />
          <Button
            onClick={createComment}
            disabled={!newComment.trim() || submitting}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

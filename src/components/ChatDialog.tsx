import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Message = Tables<"private_messages"> & {
  from_profile?: Tables<"profiles">;
  to_profile?: Tables<"profiles">;
};

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  currentUserId: string;
}

export const ChatDialog = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  currentUserId,
}: ChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      markMessagesAsRead();
      subscribeToMessages();
    }
  }, [isOpen, recipientId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("private_messages")
        .select(`
          *,
          from_profile:profiles!private_messages_from_user_id_fkey(*),
          to_profile:profiles!private_messages_to_user_id_fkey(*)
        `)
        .or(`and(from_user_id.eq.${currentUserId},to_user_id.eq.${recipientId}),and(from_user_id.eq.${recipientId},to_user_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await supabase
        .from("private_messages")
        .update({ is_read: true })
        .eq("to_user_id", currentUserId)
        .eq("from_user_id", recipientId)
        .eq("is_read", false);
    } catch (error) {
      console.error("Erro ao marcar mensagens como lidas:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${currentUserId}-${recipientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `or(and(from_user_id.eq.${currentUserId},to_user_id.eq.${recipientId}),and(from_user_id.eq.${recipientId},to_user_id.eq.${currentUserId}))`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Buscar dados do perfil do remetente
          const { data: fromProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.from_user_id)
            .single();
          
          const { data: toProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newMsg.to_user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, from_profile: fromProfile, to_profile: toProfile },
          ]);
          
          // Marcar como lida se for para o usuário atual
          if (newMsg.to_user_id === currentUserId) {
            await markMessagesAsRead();
          }
          
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const { error } = await supabase.from("private_messages").insert({
        from_user_id: currentUserId,
        to_user_id: recipientId,
        content: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      toast.success("Mensagem enviada!");
      scrollToBottom();
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      if (error.message?.includes("violates row-level security")) {
        toast.error("Você só pode enviar mensagens para vizinhos próximos ou amigos da varanda");
      } else {
        toast.error("Erro ao enviar mensagem");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {recipientName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>Conversa com {recipientName}</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">
                Nenhuma mensagem ainda
              </p>
              <p className="text-sm text-muted-foreground">
                Seja o primeiro a enviar uma mensagem!
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const isCurrentUser = message.from_user_id === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="resize-none min-h-[60px]"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

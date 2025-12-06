import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldOff, UserX, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  reason: string | null;
  blocked_profile: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface BlockedUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BlockedUsersDialog = ({
  open,
  onOpenChange,
}: BlockedUsersDialogProps) => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchBlockedUsers();
    }
  }, [open, user]);

  const fetchBlockedUsers = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("user_blocks")
        .select(`
          id,
          blocked_id,
          created_at,
          reason,
          blocked_profile:profiles!user_blocks_blocked_id_fkey(
            id,
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlockedUsers((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar usuários bloqueados:", error);
      toast.error("Erro ao carregar lista de bloqueados");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (blockId: string, userName: string) => {
    setUnblocking(blockId);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("id", blockId);

      if (error) throw error;

      toast.success(`${userName} foi desbloqueado(a)`);
      setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId));
    } catch (error) {
      console.error("Erro ao desbloquear:", error);
      toast.error("Erro ao desbloquear usuário");
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-muted-foreground" />
            Usuários Bloqueados
          </DialogTitle>
          <DialogDescription>
            Gerencie os usuários que você bloqueou. Desbloqueie para voltar a ver o perfil e interagir.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum usuário bloqueado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={block.blocked_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-orkut text-primary-foreground">
                        {block.blocked_profile?.display_name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {block.blocked_profile?.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{block.blocked_profile?.username}
                      </p>
                      {block.reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Motivo: {block.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleUnblock(block.id, block.blocked_profile?.display_name)
                    }
                    disabled={unblocking === block.id}
                  >
                    {unblocking === block.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Desbloquear"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

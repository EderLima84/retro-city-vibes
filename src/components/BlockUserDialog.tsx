import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldOff, AlertTriangle } from "lucide-react";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  onBlocked?: () => void;
}

export const BlockUserDialog = ({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  onBlocked,
}: BlockUserDialogProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .insert({
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: targetUserId,
          reason: reason.trim() || null,
        });

      if (error) throw error;

      toast.success(`${targetUserName} foi bloqueado(a)`);
      onOpenChange(false);
      onBlocked?.();
    } catch (error: any) {
      console.error("Erro ao bloquear usuário:", error);
      if (error.code === "23505") {
        toast.error("Este usuário já está bloqueado");
      } else {
        toast.error("Erro ao bloquear usuário");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldOff className="w-5 h-5" />
            Bloquear Usuário
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  Tem certeza que deseja bloquear {targetUserName}?
                </p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• O perfil desta pessoa será ocultado para você</li>
                  <li>• Esta pessoa não poderá ver seu perfil</li>
                  <li>• Mensagens e interações serão bloqueadas</li>
                  <li>• Você pode desbloquear a qualquer momento</li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Motivo (opcional)
          </label>
          <Textarea
            placeholder="Descreva o motivo do bloqueio..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleBlock}
            disabled={loading}
            className="gap-2"
          >
            <ShieldOff className="w-4 h-4" />
            {loading ? "Bloqueando..." : "Bloquear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

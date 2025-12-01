import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tables } from '@/integrations/supabase/types';
import { Gift, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type GiftWithSender = Tables<'gifts'> & {
  sender: Tables<'profiles'>;
};

interface ReceivedGiftsProps {
  userId: string;
  isOwner: boolean;
}

const giftEmojis: Record<string, string> = {
  coffee: '☕',
  flowers: '💐',
  heart: '💝',
  sparkle: '✨',
  sun: '☀️',
  music: '🎵'
};

export const ReceivedGifts = ({ userId, isOwner }: ReceivedGiftsProps) => {
  const [gifts, setGifts] = useState<GiftWithSender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGifts();
  }, [userId]);

  const fetchGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select(`
          *,
          sender:from_user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGifts(data as any || []);
    } catch (error) {
      console.error('Erro ao buscar presentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGift = async (giftId: string) => {
    try {
      const { error } = await supabase
        .from('gifts')
        .delete()
        .eq('id', giftId);

      if (error) throw error;

      toast.success('Presente removido');
      fetchGifts();
    } catch (error) {
      console.error('Erro ao deletar presente:', error);
      toast.error('Não foi possível remover o presente');
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/95 backdrop-blur-sm">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-500" />
          Presentes Recebidos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {gifts.length} {gifts.length === 1 ? 'presente' : 'presentes'}
        </p>
      </CardHeader>
      <CardContent>
        {gifts.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {isOwner ? 'Você ainda não recebeu presentes' : 'Nenhum presente ainda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="relative p-4 rounded-lg border bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-200/20 hover:border-pink-300/40 transition-all"
              >
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGift(gift.id)}
                    className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-destructive/20"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
                <div className="text-center space-y-2">
                  <div className="text-4xl mb-2">
                    {giftEmojis[gift.gift_type] || '🎁'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{gift.sender.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{gift.sender.username}</p>
                  </div>
                  {gift.message && (
                    <p className="text-xs italic text-muted-foreground line-clamp-2 mt-1">
                      "{gift.message}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(gift.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

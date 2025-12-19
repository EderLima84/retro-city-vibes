import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InviteCode {
  id: string;
  code: string;
  user_id: string;
  created_at: string;
  used_count: number;
  max_uses: number;
  expires_at: string | null;
  is_active: boolean;
}

interface InviteValidation {
  isValid: boolean;
  code?: InviteCode;
  error?: string;
}

export const useInvites = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const validateInviteCode = async (code: string): Promise<InviteValidation> => {
    try {
      setLoading(true);

      if (!code || code.trim() === '') {
        return { isValid: false, error: 'Código de convite é obrigatório' };
      }

      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { isValid: false, error: 'Código de convite inválido ou expirado' };
        }
        throw error;
      }

      // Verificar se o código não expirou
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { isValid: false, error: 'Código de convite expirado' };
      }

      // Verificar se ainda tem usos disponíveis
      if (data.used_count >= data.max_uses) {
        return { isValid: false, error: 'Código de convite esgotado' };
      }

      // Verificar se o usuário não está tentando usar seu próprio código
      if (user && data.user_id === user.id) {
        return { isValid: false, error: 'Você não pode usar seu próprio código de convite' };
      }

      return { isValid: true, code: data };

    } catch (error) {
      console.error('Erro ao validar código de convite:', error);
      return { isValid: false, error: 'Erro ao validar código de convite' };
    } finally {
      setLoading(false);
    }
  };

  const useInviteCode = async (code: string, newUserId: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Validar o código primeiro
      const validation = await validateInviteCode(code);
      if (!validation.isValid || !validation.code) {
        toast.error(validation.error || 'Código inválido');
        return false;
      }

      // Incrementar contador de uso
      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({ 
          used_count: validation.code.used_count + 1 
        })
        .eq('id', validation.code.id);

      if (updateError) throw updateError;

      // Registrar o uso do convite
      const { error: logError } = await supabase
        .from('invite_usage')
        .insert({
          invite_code_id: validation.code.id,
          inviter_id: validation.code.user_id,
          invited_user_id: newUserId,
          used_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Erro ao registrar uso do convite:', logError);
        // Não falha a operação se não conseguir registrar o log
      }

      // Dar pontos para quem convidou
      await giveInviteReward(validation.code.user_id, 50);

      toast.success('🎉 Convite aplicado com sucesso!');
      return true;

    } catch (error) {
      console.error('Erro ao usar código de convite:', error);
      toast.error('Erro ao aplicar código de convite');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const giveInviteReward = async (userId: string, points: number) => {
    try {
      // Atualizar pontos do usuário
      const { error } = await supabase
        .from('profiles')
        .update({ 
          points: supabase.sql`points + ${points}` 
        })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao dar recompensa:', error);
      }

      // Verificar conquistas baseadas em convites
      await checkInviteAchievements(userId);

    } catch (error) {
      console.error('Erro ao processar recompensa:', error);
    }
  };

  const checkInviteAchievements = async (userId: string) => {
    try {
      // Contar total de convites aceitos
      const { data: inviteCodes } = await supabase
        .from('invite_codes')
        .select('used_count')
        .eq('user_id', userId);

      const totalInvites = inviteCodes?.reduce((sum, code) => sum + code.used_count, 0) || 0;

      // Conquista: Primeiro Convite (1 convite)
      if (totalInvites >= 1) {
        await giveAchievement(userId, 'first-invite');
      }

      // Conquista: Embaixador (5 convites)
      if (totalInvites >= 5) {
        await giveAchievement(userId, 'ambassador');
      }

      // Conquista: Influenciador (10 convites)
      if (totalInvites >= 10) {
        await giveAchievement(userId, 'influencer');
      }

      // Conquista: Lenda (25 convites)
      if (totalInvites >= 25) {
        await giveAchievement(userId, 'legend');
      }

    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
    }
  };

  const giveAchievement = async (userId: string, achievementType: string) => {
    try {
      // Verificar se já tem a conquista
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_type', achievementType)
        .single();

      if (existing) return; // Já tem a conquista

      // Dar a conquista
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_type: achievementType,
          earned_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao dar conquista:', error);
      }

    } catch (error) {
      console.error('Erro ao processar conquista:', error);
    }
  };

  const getInviteStats = async (userId: string) => {
    try {
      const { data: codes } = await supabase
        .from('invite_codes')
        .select('used_count')
        .eq('user_id', userId);

      const totalInvites = codes?.reduce((sum, code) => sum + code.used_count, 0) || 0;

      return {
        totalInvites,
        rewardPoints: totalInvites * 50,
        achievements: Math.floor(totalInvites / 5)
      };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalInvites: 0,
        rewardPoints: 0,
        achievements: 0
      };
    }
  };

  return {
    validateInviteCode,
    useInviteCode,
    getInviteStats,
    loading
  };
};
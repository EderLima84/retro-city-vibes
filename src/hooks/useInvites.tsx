import { useState } from 'react';
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

interface InviteStats {
  totalInvites: number;
  successfulInvites: number;
  rewardPoints: number;
}

export const useInvites = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const generateInviteCode = async (): Promise<InviteCode | null> => {
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return null;
    }

    try {
      setLoading(true);

      // Generate unique code
      const code = `ORK-${user.id.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      
      // Set expiration to 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data, error } = await supabase
        .from('invite_codes')
        .insert({
          code,
          user_id: user.id,
          max_uses: 10,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('✨ Código de convite gerado!');
      return data as InviteCode;

    } catch (error) {
      console.error('Erro ao gerar código de convite:', error);
      toast.error('Erro ao gerar código de convite');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getUserInviteCode = async (): Promise<InviteCode | null> => {
    if (!user) return null;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as InviteCode | null;

    } catch (error) {
      console.error('Erro ao buscar código de convite:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

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
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return { isValid: false, error: 'Código de convite não encontrado' };
      }

      const inviteCode = data as InviteCode;

      // Check if code is still valid
      if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
        return { isValid: false, error: 'Código de convite expirado' };
      }

      if (inviteCode.used_count >= inviteCode.max_uses) {
        return { isValid: false, error: 'Código de convite já atingiu o limite de uso' };
      }

      return { isValid: true, code: inviteCode };

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

      // Validate the code first
      const validation = await validateInviteCode(code);
      if (!validation.isValid || !validation.code) {
        toast.error(validation.error || 'Código inválido');
        return false;
      }

      // Record the use
      const { error } = await supabase
        .from('invite_uses')
        .insert({
          invite_code_id: validation.code.id,
          used_by_user_id: newUserId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.error('Você já usou este código de convite');
        } else {
          throw error;
        }
        return false;
      }

      // Award points to the inviter - increment directly
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', validation.code.user_id)
        .single();

      if (inviterProfile) {
        await supabase
          .from('profiles')
          .update({ points: (inviterProfile.points || 0) + 50 })
          .eq('id', validation.code.user_id);
      }

      toast.success('🎉 Código de convite aplicado com sucesso!');
      return true;

    } catch (error) {
      console.error('Erro ao usar código de convite:', error);
      toast.error('Erro ao aplicar código de convite');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getInviteStats = async (userId: string): Promise<InviteStats> => {
    try {
      // Get user's invite codes
      const { data: codes, error: codesError } = await supabase
        .from('invite_codes')
        .select('id, used_count')
        .eq('user_id', userId);

      if (codesError) throw codesError;

      const totalUsed = codes?.reduce((sum, code) => sum + (code.used_count || 0), 0) || 0;

      return {
        totalInvites: codes?.length || 0,
        successfulInvites: totalUsed,
        rewardPoints: totalUsed * 50
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalInvites: 0,
        successfulInvites: 0,
        rewardPoints: 0
      };
    }
  };

  return {
    generateInviteCode,
    getUserInviteCode,
    validateInviteCode,
    useInviteCode,
    getInviteStats,
    loading
  };
};

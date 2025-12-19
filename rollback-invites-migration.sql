-- ============================================
-- ROLLBACK: Sistema de Convites
-- Execute este SQL se precisar reverter a migration
-- ============================================

-- Remove trigger
DROP TRIGGER IF EXISTS trigger_update_invite_stats ON public.invites;

-- Remove functions
DROP FUNCTION IF EXISTS update_invite_stats();
DROP FUNCTION IF EXISTS accept_invite(TEXT, UUID);
DROP FUNCTION IF EXISTS create_invite(UUID);
DROP FUNCTION IF EXISTS generate_invite_code();

-- Remove columns from profiles
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS invites_sent,
DROP COLUMN IF EXISTS invites_accepted;

-- Remove table
DROP TABLE IF EXISTS public.invites;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Rollback completed successfully! Sistema de convites removido.';
END $$;

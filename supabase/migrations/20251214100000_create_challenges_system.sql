-- ============================================
-- MIGRATION: Sistema de Desafios e Níveis
-- ============================================

-- Tabela de desafios
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  category TEXT NOT NULL CHECK (category IN ('social', 'content', 'engagement', 'exploration')),
  target_value INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 10,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabela de progresso dos usuários nos desafios
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER DEFAULT 0,
  target_value INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, expires_at)
);

-- Tabela de níveis e recompensas
CREATE TABLE IF NOT EXISTS public.levels (
  level INTEGER PRIMARY KEY,
  xp_required INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  rewards JSONB DEFAULT '[]'::jsonb,
  badge_icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de histórico de XP
CREATE TABLE IF NOT EXISTS public.xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar campos de XP e nível aos profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_challenges_type ON public.challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON public.challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_expires_at ON public.user_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON public.xp_history(user_id);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active challenges"
  ON public.challenges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own challenge progress"
  ON public.user_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge progress"
  ON public.user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view levels"
  ON public.levels FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own XP history"
  ON public.xp_history FOR SELECT
  USING (auth.uid() = user_id);

-- Função para calcular nível baseado em XP
CREATE OR REPLACE FUNCTION calculate_level(p_total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_level INTEGER;
BEGIN
  SELECT COALESCE(MAX(level), 1)
  INTO v_level
  FROM public.levels
  WHERE xp_required <= p_total_xp;
  
  RETURN v_level;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar XP ao usuário
CREATE OR REPLACE FUNCTION add_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN, total_xp INTEGER) AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_old_total_xp INTEGER;
  v_new_total_xp INTEGER;
  v_level_up BOOLEAN := false;
BEGIN
  -- Get current stats
  SELECT level, total_xp
  INTO v_old_level, v_old_total_xp
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Calculate new total XP
  v_new_total_xp := v_old_total_xp + p_amount;
  
  -- Calculate new level
  v_new_level := calculate_level(v_new_total_xp);
  
  -- Check if leveled up
  IF v_new_level > v_old_level THEN
    v_level_up := true;
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    xp = xp + p_amount,
    total_xp = v_new_total_xp,
    level = v_new_level,
    points = points + p_amount
  WHERE id = p_user_id;
  
  -- Record XP history
  INSERT INTO public.xp_history (user_id, amount, source, description)
  VALUES (p_user_id, p_amount, p_source, p_description);
  
  RETURN QUERY SELECT v_new_level, v_level_up, v_new_total_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar progresso do desafio
CREATE OR REPLACE FUNCTION update_challenge_progress(
  p_user_id UUID,
  p_challenge_id UUID,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_challenge RECORD;
  v_user_challenge RECORD;
  v_completed BOOLEAN := false;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM public.challenges
  WHERE id = p_challenge_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get or create user challenge
  SELECT * INTO v_user_challenge
  FROM public.user_challenges
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id
    AND expires_at > NOW()
    AND completed = false;
  
  IF NOT FOUND THEN
    -- Create new user challenge
    INSERT INTO public.user_challenges (
      user_id, 
      challenge_id, 
      current_progress, 
      target_value,
      expires_at
    )
    VALUES (
      p_user_id,
      p_challenge_id,
      p_increment,
      v_challenge.target_value,
      CASE v_challenge.type
        WHEN 'daily' THEN (CURRENT_DATE + INTERVAL '1 day')::timestamptz
        WHEN 'weekly' THEN (CURRENT_DATE + INTERVAL '7 days')::timestamptz
        WHEN 'monthly' THEN (CURRENT_DATE + INTERVAL '30 days')::timestamptz
      END
    )
    RETURNING * INTO v_user_challenge;
  ELSE
    -- Update existing progress
    UPDATE public.user_challenges
    SET current_progress = current_progress + p_increment
    WHERE id = v_user_challenge.id
    RETURNING * INTO v_user_challenge;
  END IF;
  
  -- Check if completed
  IF v_user_challenge.current_progress >= v_user_challenge.target_value THEN
    UPDATE public.user_challenges
    SET 
      completed = true,
      completed_at = NOW()
    WHERE id = v_user_challenge.id;
    
    -- Award XP and points
    PERFORM add_xp(
      p_user_id,
      v_challenge.xp_reward,
      'challenge_completed',
      'Desafio completado: ' || v_challenge.title
    );
    
    v_completed := true;
  END IF;
  
  RETURN v_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar streak diário
CREATE OR REPLACE FUNCTION update_daily_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_activity, v_current_streak, v_longest_streak
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if activity is today
  IF v_last_activity = CURRENT_DATE THEN
    RETURN v_current_streak;
  END IF;
  
  -- Check if activity was yesterday (continue streak)
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, start over
    v_new_streak := 1;
  END IF;
  
  -- Update longest streak if necessary
  IF v_new_streak > v_longest_streak THEN
    v_longest_streak := v_new_streak;
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    current_streak = v_new_streak,
    longest_streak = v_longest_streak,
    last_activity_date = CURRENT_DATE
  WHERE id = p_user_id;
  
  -- Award bonus XP for streaks
  IF v_new_streak % 7 = 0 THEN
    PERFORM add_xp(p_user_id, 100, 'streak_bonus', 'Bônus de ' || v_new_streak || ' dias consecutivos!');
  END IF;
  
  RETURN v_new_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir níveis padrão
INSERT INTO public.levels (level, xp_required, title, description, badge_icon) VALUES
(1, 0, 'Novo Cidadão', 'Bem-vindo à Cidade Portella!', '🌱'),
(2, 100, 'Vizinho Amigável', 'Você está se integrando à comunidade', '👋'),
(3, 250, 'Morador Ativo', 'Sua presença é notada na cidade', '🏠'),
(4, 500, 'Cidadão Engajado', 'Você contribui ativamente', '⭐'),
(5, 1000, 'Pilar da Comunidade', 'Sua participação é essencial', '🌟'),
(6, 2000, 'Líder Comunitário', 'Você inspira outros cidadãos', '👑'),
(7, 3500, 'Guardião da Cidade', 'Você protege e guia a comunidade', '🛡️'),
(8, 5500, 'Lenda Viva', 'Seu nome é conhecido por todos', '🏆'),
(9, 8000, 'Ícone de Portella', 'Você é parte da história da cidade', '💎'),
(10, 12000, 'Fundador Honorário', 'Você moldou o futuro de Portella', '👑✨')
ON CONFLICT (level) DO NOTHING;

-- Inserir desafios padrão
INSERT INTO public.challenges (title, description, type, category, target_value, points_reward, xp_reward, icon) VALUES
-- Desafios Diários
('Primeira Visita do Dia', 'Faça login na plataforma', 'daily', 'engagement', 1, 10, 25, '☀️'),
('Socializar na Praça', 'Publique algo na Praça Central', 'daily', 'content', 1, 15, 30, '💬'),
('Fazer Amizades', 'Envie uma solicitação de amizade', 'daily', 'social', 1, 20, 40, '🤝'),
('Explorador Diário', 'Visite 3 perfis diferentes', 'daily', 'exploration', 3, 15, 35, '🔍'),
('Curtir e Compartilhar', 'Curta 5 posts diferentes', 'daily', 'engagement', 5, 10, 20, '❤️'),

-- Desafios Semanais
('Semana Social', 'Faça 5 novos amigos esta semana', 'weekly', 'social', 5, 50, 100, '👥'),
('Criador de Conteúdo', 'Publique 10 posts esta semana', 'weekly', 'content', 10, 75, 150, '✍️'),
('Engajamento Total', 'Comente em 20 posts diferentes', 'weekly', 'engagement', 20, 60, 120, '💭'),
('Explorador Semanal', 'Visite todas as seções da cidade', 'weekly', 'exploration', 7, 80, 160, '🗺️'),
('Mensageiro Ativo', 'Envie 15 mensagens para amigos', 'weekly', 'social', 15, 40, 80, '📨'),

-- Desafios Mensais
('Mestre Social', 'Tenha 20 amigos ativos', 'monthly', 'social', 20, 200, 400, '🌟'),
('Influenciador', 'Receba 100 curtidas em seus posts', 'monthly', 'content', 100, 250, 500, '📈'),
('Pilar da Comunidade', 'Faça login por 25 dias no mês', 'monthly', 'engagement', 25, 300, 600, '🏛️'),
('Convite Mestre', 'Convide 5 novos usuários', 'monthly', 'social', 5, 150, 300, '🎁'),
('Explorador Completo', 'Complete todos os desafios semanais', 'monthly', 'exploration', 4, 400, 800, '🏆')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_challenges TO authenticated;
GRANT SELECT ON public.levels TO authenticated;
GRANT SELECT, INSERT ON public.xp_history TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION add_xp(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_challenge_progress(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_streak(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed! Sistema de desafios e níveis criado com sucesso.';
END $$;

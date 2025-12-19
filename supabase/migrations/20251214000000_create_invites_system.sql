-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX idx_invites_code ON public.invites(code);
CREATE INDEX idx_invites_inviter_id ON public.invites(inviter_id);
CREATE INDEX idx_invites_status ON public.invites(status);

-- Enable RLS
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- Policies for invites
CREATE POLICY "Users can view their own invites"
  ON public.invites
  FOR SELECT
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invites"
  ON public.invites
  FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Anyone can view invite by code"
  ON public.invites
  FOR SELECT
  USING (true);

CREATE POLICY "System can update invites"
  ON public.invites
  FOR UPDATE
  USING (true);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create invite with auto-generated code
CREATE OR REPLACE FUNCTION create_invite(p_inviter_id UUID)
RETURNS TABLE(invite_code TEXT, invite_id UUID) AS $$
DECLARE
  v_code TEXT;
  v_id UUID;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_code := generate_invite_code();
    v_attempts := v_attempts + 1;
    
    -- Try to insert
    BEGIN
      INSERT INTO public.invites (code, inviter_id)
      VALUES (v_code, p_inviter_id)
      RETURNING id INTO v_id;
      
      RETURN QUERY SELECT v_code, v_id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempts > 10 THEN
        RAISE EXCEPTION 'Could not generate unique invite code after 10 attempts';
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invite
CREATE OR REPLACE FUNCTION accept_invite(p_code TEXT, p_invitee_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_invite_id UUID;
  v_status TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Get invite details
  SELECT id, status, expires_at
  INTO v_invite_id, v_status, v_expires_at
  FROM public.invites
  WHERE code = p_code;
  
  -- Check if invite exists
  IF v_invite_id IS NULL THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;
  
  -- Check if already accepted
  IF v_status = 'accepted' THEN
    RAISE EXCEPTION 'Invite code already used';
  END IF;
  
  -- Check if expired
  IF v_expires_at < NOW() THEN
    UPDATE public.invites
    SET status = 'expired'
    WHERE id = v_invite_id;
    
    RAISE EXCEPTION 'Invite code has expired';
  END IF;
  
  -- Accept invite
  UPDATE public.invites
  SET 
    status = 'accepted',
    invitee_id = p_invitee_id,
    accepted_at = NOW()
  WHERE id = v_invite_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add invite stats to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS invites_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invites_accepted INTEGER DEFAULT 0;

-- Trigger to update invite stats
CREATE OR REPLACE FUNCTION update_invite_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment invites_sent
    UPDATE public.profiles
    SET invites_sent = invites_sent + 1
    WHERE id = NEW.inviter_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Increment invites_accepted
    UPDATE public.profiles
    SET invites_accepted = invites_accepted + 1
    WHERE id = NEW.inviter_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invite_stats
AFTER INSERT OR UPDATE ON public.invites
FOR EACH ROW
EXECUTE FUNCTION update_invite_stats();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.invites TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION create_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invite(TEXT, UUID) TO authenticated;

-- Create invite_codes table for the invite system
CREATE TABLE public.invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 10,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create index for quick code lookups
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_user_id ON public.invite_codes(user_id);

-- Enable Row Level Security
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Policies for invite_codes
-- Users can view their own invite codes
CREATE POLICY "Users can view their own invite codes"
ON public.invite_codes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own invite codes
CREATE POLICY "Users can create their own invite codes"
ON public.invite_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own invite codes
CREATE POLICY "Users can update their own invite codes"
ON public.invite_codes
FOR UPDATE
USING (auth.uid() = user_id);

-- Anyone can read invite codes for validation (only code field check)
CREATE POLICY "Anyone can validate invite codes"
ON public.invite_codes
FOR SELECT
USING (is_active = true);

-- Create invite_uses table to track who used which code
CREATE TABLE public.invite_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_code_id UUID NOT NULL REFERENCES public.invite_codes(id) ON DELETE CASCADE,
  used_by_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(invite_code_id, used_by_user_id)
);

-- Enable RLS on invite_uses
ALTER TABLE public.invite_uses ENABLE ROW LEVEL SECURITY;

-- Users can see invites they've used
CREATE POLICY "Users can view their invite uses"
ON public.invite_uses
FOR SELECT
USING (auth.uid() = used_by_user_id);

-- Users can record using an invite
CREATE POLICY "Users can record using an invite"
ON public.invite_uses
FOR INSERT
WITH CHECK (auth.uid() = used_by_user_id);

-- Invite code owners can see who used their codes
CREATE POLICY "Invite owners can see uses of their codes"
ON public.invite_uses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invite_codes 
    WHERE invite_codes.id = invite_uses.invite_code_id 
    AND invite_codes.user_id = auth.uid()
  )
);

-- Function to increment used_count when a code is used
CREATE OR REPLACE FUNCTION public.increment_invite_used_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invite_codes
  SET used_count = used_count + 1
  WHERE id = NEW.invite_code_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-increment used_count
CREATE TRIGGER on_invite_use_increment_count
  AFTER INSERT ON public.invite_uses
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_invite_used_count();
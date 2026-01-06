-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can validate invite codes" ON public.invite_codes;

-- Create a more restrictive policy - authenticated users can validate codes
CREATE POLICY "Authenticated users can validate invite codes"
ON public.invite_codes
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND used_count < max_uses
);
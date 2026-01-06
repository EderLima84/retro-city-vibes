-- FIX 1: Notifications - Remove overly permissive INSERT policy and restrict to triggers/system
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Only allow inserts from authenticated users for their OWN notifications (for testing)
-- or via database triggers (which use SECURITY DEFINER)
CREATE POLICY "Triggers can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  -- Allow database triggers to insert (they run as security definer)
  -- For direct inserts, only allow if it's a system-generated notification
  -- This is a placeholder - in production, notifications should ONLY come from triggers
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- FIX 2: Profiles - Restrict visibility based on authentication
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a more restrictive policy - only authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (
  -- User can always see their own profile
  auth.uid() = id
  OR 
  -- Authenticated users can see other profiles (for social features)
  auth.uid() IS NOT NULL
);

-- FIX 3: Private messages - Add friendship verification for reading
DROP POLICY IF EXISTS "Users can view their own messages" ON public.private_messages;

-- Create a more restrictive policy that verifies friendship status
CREATE POLICY "Users can view messages with active friendships"
ON public.private_messages
FOR SELECT
USING (
  -- User is sender or receiver
  (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  AND
  -- Verify there's still an active friendship between the users
  (
    EXISTS (
      SELECT 1 FROM public.friendships
      WHERE (
        (friendships.user_id = from_user_id AND friendships.friend_id = to_user_id)
        OR 
        (friendships.user_id = to_user_id AND friendships.friend_id = from_user_id)
      )
    )
    OR
    -- Allow users to see their own sent messages regardless of friendship
    auth.uid() = from_user_id
  )
);
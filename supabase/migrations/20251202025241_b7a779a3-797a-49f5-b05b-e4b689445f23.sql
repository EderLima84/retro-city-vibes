-- Create private_messages table for chat between neighbors
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.private_messages
FOR SELECT
USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);

-- Policy: Users can send messages to their neighbors (vizinho or higher)
CREATE POLICY "Users can send messages to neighbors"
ON public.private_messages
FOR INSERT
WITH CHECK (
  auth.uid() = from_user_id AND
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (
      (user_id = auth.uid() AND friend_id = to_user_id) OR
      (user_id = to_user_id AND friend_id = auth.uid())
    )
    AND level IN ('vizinho', 'amigo_varanda')
  )
);

-- Policy: Users can update messages they received (mark as read)
CREATE POLICY "Users can mark messages as read"
ON public.private_messages
FOR UPDATE
USING (auth.uid() = to_user_id)
WITH CHECK (auth.uid() = to_user_id);

-- Policy: Users can delete messages they sent or received
CREATE POLICY "Users can delete their own messages"
ON public.private_messages
FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Create index for better performance
CREATE INDEX idx_private_messages_from_user ON public.private_messages(from_user_id);
CREATE INDEX idx_private_messages_to_user ON public.private_messages(to_user_id);
CREATE INDEX idx_private_messages_created_at ON public.private_messages(created_at DESC);

-- Enable realtime for private messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
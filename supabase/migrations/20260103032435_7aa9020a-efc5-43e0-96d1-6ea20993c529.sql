-- Create post_reactions table for emoji reactions
CREATE TABLE public.post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('love', 'laugh', 'wow', 'sad', 'angry', 'fire')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment_replies table for nested replies
CREATE TABLE public.comment_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for push notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reaction', 'friend_request', 'mention', 'reply')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_reactions
CREATE POLICY "Post reactions are viewable by everyone"
  ON public.post_reactions FOR SELECT USING (true);

CREATE POLICY "Users can add reactions"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON public.post_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reactions"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for comment_replies
CREATE POLICY "Comment replies are viewable by everyone"
  ON public.comment_replies FOR SELECT USING (true);

CREATE POLICY "Users can create replies"
  ON public.comment_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
  ON public.comment_replies FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to send notification on like
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  liker_name TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker's name
  SELECT display_name INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  VALUES (
    post_owner_id,
    'like',
    'Nova curtida!',
    liker_name || ' curtiu seu post',
    NEW.post_id,
    'post'
  );
  
  RETURN NEW;
END;
$$;

-- Create function to send notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get commenter's name
  SELECT display_name INTO commenter_name FROM public.profiles WHERE id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  VALUES (
    post_owner_id,
    'comment',
    'Novo comentário!',
    commenter_name || ' comentou no seu post',
    NEW.post_id,
    'post'
  );
  
  RETURN NEW;
END;
$$;

-- Create function to send notification on reaction
CREATE OR REPLACE FUNCTION public.notify_on_reaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_owner_id UUID;
  reactor_name TEXT;
  reaction_emoji TEXT;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify if user reacts to their own post
  IF post_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get reactor's name
  SELECT display_name INTO reactor_name FROM public.profiles WHERE id = NEW.user_id;
  
  -- Map reaction type to emoji
  reaction_emoji := CASE NEW.type
    WHEN 'love' THEN '❤️'
    WHEN 'laugh' THEN '😂'
    WHEN 'wow' THEN '😮'
    WHEN 'sad' THEN '😢'
    WHEN 'angry' THEN '😠'
    WHEN 'fire' THEN '🔥'
    ELSE '👍'
  END;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, related_id, related_type)
  VALUES (
    post_owner_id,
    'reaction',
    'Nova reação!',
    reactor_name || ' reagiu ' || reaction_emoji || ' ao seu post',
    NEW.post_id,
    'post'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_post_like_notify
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_like();

CREATE TRIGGER on_comment_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment();

CREATE TRIGGER on_reaction_notify
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reaction();

-- Add indexes for better performance
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX idx_comment_replies_comment_id ON public.comment_replies(comment_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
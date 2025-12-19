-- Create group_chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create message_read_status table (for tracking who read what in groups)
CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create conversation_mutes table
CREATE TABLE IF NOT EXISTS conversation_mutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('private', 'group')),
  conversation_id UUID NOT NULL,
  muted_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_type, conversation_id)
);

-- Create typing_indicators table (for real-time typing status)
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('private', 'group')),
  conversation_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_type, conversation_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_mutes_user_id ON conversation_mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation ON typing_indicators(conversation_type, conversation_id);

-- Enable Row Level Security
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_chats
CREATE POLICY "Users can view groups they are members of"
  ON group_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON group_chats FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update group details"
  ON group_chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_chats.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- RLS Policies for group_members
CREATE POLICY "Users can view members of their groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can add members"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_members.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Group admins can remove members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

CREATE POLICY "Members can leave groups"
  ON group_members FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for group_messages
CREATE POLICY "Group members can view messages"
  ON group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_messages.group_id
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own messages"
  ON group_messages FOR UPDATE
  USING (sender_id = auth.uid());

-- RLS Policies for message_read_status
CREATE POLICY "Users can view their own read status"
  ON message_read_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
  ON message_read_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for conversation_mutes
CREATE POLICY "Users can manage their own mutes"
  ON conversation_mutes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for typing_indicators
CREATE POLICY "Users can view typing indicators in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    (conversation_type = 'private' AND (
      user_id = auth.uid() OR
      conversation_id::text IN (
        SELECT id::text FROM profiles WHERE id = auth.uid()
      )
    )) OR
    (conversation_type = 'group' AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = conversation_id
      AND group_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can manage their own typing indicators"
  ON typing_indicators FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to get unread message count for a group
CREATE OR REPLACE FUNCTION get_group_unread_count(p_group_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM group_messages gm
    WHERE gm.group_id = p_group_id
    AND gm.sender_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM message_read_status mrs
      WHERE mrs.message_id = gm.id
      AND mrs.user_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in a group as read
CREATE OR REPLACE FUNCTION mark_group_messages_read(p_group_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO message_read_status (message_id, user_id)
  SELECT gm.id, p_user_id
  FROM group_messages gm
  WHERE gm.group_id = p_group_id
  AND gm.sender_id != p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM message_read_status mrs
    WHERE mrs.message_id = gm.id
    AND mrs.user_id = p_user_id
  )
  ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS VOID AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE started_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update group updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE group_chats
  SET updated_at = NOW()
  WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_on_message
  AFTER INSERT ON group_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_group_timestamp();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

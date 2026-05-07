-- Direct Messages: conversations, participants, messages, RLS, RPCs

-- 1. Tables

CREATE TABLE public.conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at    timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE public.direct_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body            text,
  attachment_url  text,
  attachment_type text CHECK (attachment_type = 'image'),
  reply_to_id     uuid REFERENCES public.direct_messages(id) ON DELETE SET NULL,
  client_temp_id  text,
  created_at      timestamptz DEFAULT now() NOT NULL,
  edited_at       timestamptz,
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES public.users(id),
  CONSTRAINT dm_has_content CHECK (body IS NOT NULL OR attachment_url IS NOT NULL),
  CONSTRAINT dm_body_length CHECK (body IS NULL OR char_length(body) BETWEEN 1 AND 2000)
);

CREATE INDEX direct_messages_conversation_created ON public.direct_messages (conversation_id, created_at DESC);

-- 2. RLS

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is current user a participant of this conversation?
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = auth.uid()
  );
$$;

-- Conversations: read if participant
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT TO authenticated USING (is_conversation_participant(id));

-- Participants: read list if participant; update own row (for last_read_at)
CREATE POLICY "cp_select" ON public.conversation_participants
  FOR SELECT TO authenticated USING (is_conversation_participant(conversation_id));

CREATE POLICY "cp_update_own" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Direct messages: read/insert if participant; update/soft-delete own messages
CREATE POLICY "dm_select" ON public.direct_messages
  FOR SELECT TO authenticated USING (is_conversation_participant(conversation_id));

CREATE POLICY "dm_insert" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (is_conversation_participant(conversation_id) AND sender_id = auth.uid());

CREATE POLICY "dm_update_own" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND is_conversation_participant(conversation_id));

-- 3. get_or_create_conversation(other_user_id) → conversation uuid

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  conv_id uuid;
BEGIN
  -- Find existing 1:1 conversation between the two users
  SELECT cp1.conversation_id INTO conv_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2
    ON cp2.conversation_id = cp1.conversation_id
    AND cp2.user_id = other_user_id
  WHERE cp1.user_id = auth.uid()
    AND (
      SELECT COUNT(*) FROM public.conversation_participants
      WHERE conversation_id = cp1.conversation_id
    ) = 2
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, auth.uid()), (conv_id, other_user_id);
  RETURN conv_id;
END;
$$;

-- 4. get_my_conversations() → inbox list with unread counts

CREATE OR REPLACE FUNCTION public.get_my_conversations()
RETURNS TABLE (
  conversation_id        uuid,
  other_user_id          uuid,
  other_full_name        text,
  other_avatar_url       text,
  other_last_seen_at     timestamptz,
  other_ring_color       text,
  last_message_body      text,
  last_message_attachment_url text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count           bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    cp_me.conversation_id,
    u.id,
    u.full_name,
    u.avatar_url,
    u.last_seen_at,
    t.ring_color,
    lm.body,
    lm.attachment_url,
    lm.created_at,
    lm.sender_id,
    COALESCE((
      SELECT COUNT(*)
      FROM public.direct_messages dm_u
      WHERE dm_u.conversation_id = cp_me.conversation_id
        AND dm_u.created_at > COALESCE(cp_me.last_read_at, '-infinity'::timestamptz)
        AND dm_u.sender_id != auth.uid()
        AND dm_u.deleted_at IS NULL
    ), 0) AS unread_count
  FROM public.conversation_participants cp_me
  JOIN public.conversations conv ON conv.id = cp_me.conversation_id
  JOIN public.conversation_participants cp_other
    ON cp_other.conversation_id = cp_me.conversation_id
    AND cp_other.user_id != auth.uid()
  JOIN public.users u ON u.id = cp_other.user_id
  LEFT JOIN public.tiers t ON t.id = u.tier_id
  LEFT JOIN LATERAL (
    SELECT body, attachment_url, created_at, sender_id
    FROM public.direct_messages
    WHERE conversation_id = cp_me.conversation_id AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 1
  ) lm ON true
  WHERE cp_me.user_id = auth.uid()
  ORDER BY COALESCE(lm.created_at, conv.created_at) DESC;
$$;

-- 5. get_conversation_other_user(conv_id) → the other participant's profile

CREATE OR REPLACE FUNCTION public.get_conversation_other_user(conv_id uuid)
RETURNS TABLE (id uuid, full_name text, avatar_url text, last_seen_at timestamptz, ring_color text)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT u.id, u.full_name, u.avatar_url, u.last_seen_at, t.ring_color
  FROM public.conversation_participants cp
  JOIN public.users u ON u.id = cp.user_id
  LEFT JOIN public.tiers t ON t.id = u.tier_id
  WHERE cp.conversation_id = conv_id
    AND cp.user_id != auth.uid()
    AND is_conversation_participant(conv_id)
  LIMIT 1;
$$;

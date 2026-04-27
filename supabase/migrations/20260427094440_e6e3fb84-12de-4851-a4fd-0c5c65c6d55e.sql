-- =========================================================
-- ENUM
-- =========================================================
CREATE TYPE public.channel_type_enum AS ENUM ('general', 'announcements', 'department');

-- =========================================================
-- channels
-- =========================================================
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  channel_type public.channel_type_enum NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  description text,
  is_admin_post_only boolean NOT NULL DEFAULT false,
  display_order int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT channel_dept_consistency CHECK (
    (channel_type = 'department' AND department_id IS NOT NULL)
    OR (channel_type <> 'department' AND department_id IS NULL)
  )
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- channel_members
-- =========================================================
CREATE TABLE public.channel_members (
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  is_muted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (channel_id, user_id)
);

CREATE INDEX idx_channel_members_user ON public.channel_members(user_id);
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- messages
-- =========================================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  client_temp_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.users(id),
  CONSTRAINT messages_body_len CHECK (char_length(body) > 0 AND char_length(body) <= 2000)
);

CREATE INDEX idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_client_temp ON public.messages(client_temp_id) WHERE client_temp_id IS NOT NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- message_reactions
-- =========================================================
CREATE TABLE public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji),
  CONSTRAINT reaction_emoji_len CHECK (char_length(emoji) > 0 AND char_length(emoji) <= 10)
);

CREATE INDEX idx_reactions_message ON public.message_reactions(message_id);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Helper: is current user a member of channel?
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_members
    WHERE channel_id = _channel_id AND user_id = _user_id
  )
$$;

-- =========================================================
-- get_unread_count
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_unread_count(_channel_id uuid, _user_id uuid)
RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.messages m
  WHERE m.channel_id = _channel_id
    AND m.deleted_at IS NULL
    AND m.sender_id <> _user_id
    AND m.created_at > COALESCE(
      (SELECT last_read_at FROM public.channel_members
       WHERE channel_id = _channel_id AND user_id = _user_id),
      'epoch'::timestamptz
    )
$$;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- channels: members or admin can SELECT
CREATE POLICY "Members or admins can read channels"
ON public.channels FOR SELECT TO authenticated
USING (public.is_current_user_admin() OR public.is_channel_member(id, auth.uid()));

-- channel_members
CREATE POLICY "Read own membership"
ON public.channel_members FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins read all memberships"
ON public.channel_members FOR SELECT TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Members can see other members of same channel"
ON public.channel_members FOR SELECT TO authenticated
USING (public.is_channel_member(channel_id, auth.uid()));

CREATE POLICY "Update own membership row"
ON public.channel_members FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- messages SELECT
CREATE POLICY "Members or admins read messages"
ON public.messages FOR SELECT TO authenticated
USING (public.is_current_user_admin() OR public.is_channel_member(channel_id, auth.uid()));

-- messages INSERT
CREATE POLICY "Members can post messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_channel_member(channel_id, auth.uid())
  AND (
    NOT (SELECT is_admin_post_only FROM public.channels WHERE id = channel_id)
    OR public.is_current_user_admin()
  )
);

-- messages UPDATE: edit window
CREATE POLICY "Edit own message within 15 min"
ON public.messages FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid()
  AND deleted_at IS NULL
  AND now() - created_at <= interval '15 minutes'
)
WITH CHECK (sender_id = auth.uid());

-- messages UPDATE: soft delete
CREATE POLICY "Soft delete own or admin"
ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid() OR public.is_current_user_admin())
WITH CHECK (true);

-- message_reactions
CREATE POLICY "Read reactions on visible messages"
ON public.message_reactions FOR SELECT TO authenticated
USING (
  public.is_current_user_admin()
  OR EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
      AND public.is_channel_member(m.channel_id, auth.uid())
  )
);

CREATE POLICY "Add own reaction"
ON public.message_reactions FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id
      AND public.is_channel_member(m.channel_id, auth.uid())
  )
);

CREATE POLICY "Remove own reaction"
ON public.message_reactions FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- =========================================================
-- TRIGGERS
-- =========================================================

-- BEFORE INSERT messages: force sender_id = auth.uid() when authenticated
CREATE OR REPLACE FUNCTION public.enforce_message_sender()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.sender_id := auth.uid();
  END IF;
  -- Defensive: clear edited/deleted on insert
  NEW.edited_at := NULL;
  NEW.deleted_at := NULL;
  NEW.deleted_by := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_message_sender
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_sender();

-- BEFORE UPDATE messages: enforce edit window + handle soft delete
CREATE OR REPLACE FUNCTION public.enforce_message_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_admin boolean := public.is_current_user_admin();
  uid uuid := auth.uid();
BEGIN
  -- Block changes to immutable columns
  IF NEW.channel_id <> OLD.channel_id
     OR NEW.sender_id <> OLD.sender_id
     OR NEW.created_at <> OLD.created_at
     OR COALESCE(NEW.client_temp_id::text,'') <> COALESCE(OLD.client_temp_id::text,'')
  THEN
    RAISE EXCEPTION 'Cannot modify immutable message fields';
  END IF;

  -- Soft delete transition
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    IF NOT (uid = OLD.sender_id OR is_admin) THEN
      RAISE EXCEPTION 'Not allowed to delete this message';
    END IF;
    NEW.deleted_by := uid;
    NEW.body := '[deleted]';
    RETURN NEW;
  END IF;

  -- Body edit
  IF NEW.body IS DISTINCT FROM OLD.body THEN
    IF OLD.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot edit deleted message';
    END IF;
    IF uid <> OLD.sender_id THEN
      RAISE EXCEPTION 'Only the sender can edit';
    END IF;
    IF now() - OLD.created_at > interval '15 minutes' THEN
      RAISE EXCEPTION 'Edit window expired';
    END IF;
    NEW.edited_at := now();
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_message_update
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_update();

-- =========================================================
-- AUTO-JOIN TRIGGERS
-- =========================================================

-- 1. Paid status transition → join general, announcements, dept channels
CREATE OR REPLACE FUNCTION public.auto_join_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.payment_status IS DISTINCT FROM 'paid' AND NEW.payment_status = 'paid' THEN
    INSERT INTO public.channel_members (channel_id, user_id)
    SELECT c.id, NEW.id FROM public.channels c
    WHERE c.channel_type IN ('general','announcements')
       OR (c.channel_type = 'department'
           AND c.department_id IN (SELECT department_id FROM public.user_departments WHERE user_id = NEW.id))
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_join_on_paid
AFTER UPDATE OF payment_status ON public.users
FOR EACH ROW EXECUTE FUNCTION public.auto_join_on_paid();

-- 2. Add department → join channel (if paid)
CREATE OR REPLACE FUNCTION public.auto_join_on_dept_add()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (SELECT payment_status FROM public.users WHERE id = NEW.user_id) = 'paid' THEN
    INSERT INTO public.channel_members (channel_id, user_id)
    SELECT c.id, NEW.user_id FROM public.channels c
    WHERE c.channel_type = 'department' AND c.department_id = NEW.department_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_join_on_dept_add
AFTER INSERT ON public.user_departments
FOR EACH ROW EXECUTE FUNCTION public.auto_join_on_dept_add();

-- 3. Remove department → leave channel
CREATE OR REPLACE FUNCTION public.auto_leave_on_dept_remove()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.channel_members cm
  USING public.channels c
  WHERE c.id = cm.channel_id
    AND c.channel_type = 'department'
    AND c.department_id = OLD.department_id
    AND cm.user_id = OLD.user_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_auto_leave_on_dept_remove
AFTER DELETE ON public.user_departments
FOR EACH ROW EXECUTE FUNCTION public.auto_leave_on_dept_remove();

-- 4. Rejection → remove from all channels
CREATE OR REPLACE FUNCTION public.auto_remove_on_reject()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.rejected_at IS NULL AND NEW.rejected_at IS NOT NULL THEN
    DELETE FROM public.channel_members WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_remove_on_reject
AFTER UPDATE OF rejected_at ON public.users
FOR EACH ROW EXECUTE FUNCTION public.auto_remove_on_reject();

-- =========================================================
-- REALTIME PUBLICATION
-- =========================================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;

-- =========================================================
-- SEED CHANNELS
-- =========================================================
INSERT INTO public.channels (slug, name, channel_type, department_id, description, is_admin_post_only, display_order) VALUES
  ('general', 'General', 'general', NULL, 'Where the whole brotherhood talks.', false, 1),
  ('announcements', 'Announcements', 'announcements', NULL, 'Updates from the founders.', true, 2),
  ('fitness', 'Fitness', 'department', '28ed8917-2fd6-4746-b59d-826147dd75b4', 'Train hard, recover smart.', false, 3),
  ('personal-brand-content', 'Personal Brand & Content', 'department', '48fc5e2b-5977-403f-9465-1537ab55174d', 'Build your name and your story.', false, 4),
  ('service', 'Service', 'department', '2ad2b187-e0eb-4781-8a1a-10e00d9fda9a', 'Service to the brotherhood and beyond.', false, 5),
  ('marketing-merchandise', 'Marketing & Merchandise', 'department', '5f40d5ed-bd12-4467-905b-8265f47f8870', 'Spread the word, move the merch.', false, 6),
  ('student', 'Student', 'department', 'b945ae4c-3b36-47e1-9d23-93e36894ebf4', 'Students of the craft.', false, 7),
  ('entrepreneurs', 'Entrepreneurs', 'department', '55b1d1ba-8316-4b04-bd68-33097c9b799e', 'Builders and operators.', false, 8);

-- =========================================================
-- BACKFILL MEMBERSHIPS for existing paid users
-- =========================================================
INSERT INTO public.channel_members (channel_id, user_id)
SELECT c.id, u.id
FROM public.users u
CROSS JOIN public.channels c
WHERE u.payment_status = 'paid'
  AND u.rejected_at IS NULL
  AND (
    c.channel_type IN ('general','announcements')
    OR (c.channel_type = 'department'
        AND c.department_id IN (SELECT department_id FROM public.user_departments WHERE user_id = u.id))
  )
ON CONFLICT DO NOTHING;

-- =========================================================
-- SEED SAMPLE MESSAGES (bypasses BEFORE INSERT auth.uid() override since auth.uid() IS NULL in migration)
-- =========================================================
DO $$
DECLARE
  v_general uuid;
  v_announce uuid;
  v_entre uuid;
  v_admin1 uuid;
  v_admin2 uuid;
  v_admin3 uuid;
BEGIN
  SELECT id INTO v_general FROM public.channels WHERE slug = 'general';
  SELECT id INTO v_announce FROM public.channels WHERE slug = 'announcements';
  SELECT id INTO v_entre FROM public.channels WHERE slug = 'entrepreneurs';

  -- Pick up to 3 admins (any paid admin users)
  SELECT id INTO v_admin1 FROM public.users WHERE is_admin = true ORDER BY created_at LIMIT 1;
  SELECT id INTO v_admin2 FROM public.users WHERE is_admin = true ORDER BY created_at OFFSET 1 LIMIT 1;
  SELECT id INTO v_admin3 FROM public.users WHERE is_admin = true ORDER BY created_at OFFSET 2 LIMIT 1;

  IF v_admin1 IS NOT NULL THEN
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_general, v_admin1, 'Welcome to the brotherhood. Glad you are here.', now() - interval '3 hours');
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_announce, v_admin1, 'Platform launch is live. Explore your channels.', now() - interval '2 hours');
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_announce, v_admin1, 'Reminder: weekly meeting Thursday 7pm.', now() - interval '1 hour');
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_entre, v_admin1, 'Drop your current project and your biggest blocker.', now() - interval '90 minutes');
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_entre, v_admin1, 'We move fast and we move together.', now() - interval '80 minutes');
  END IF;

  IF v_admin2 IS NOT NULL THEN
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_general, v_admin2, 'Use this space well. Show up for each other.', now() - interval '2 hours 30 minutes');
  END IF;

  IF v_admin3 IS NOT NULL THEN
    INSERT INTO public.messages (channel_id, sender_id, body, created_at) VALUES
      (v_general, v_admin3, 'Real growth starts in conversation. Lets talk.', now() - interval '2 hours');
  END IF;
END $$;
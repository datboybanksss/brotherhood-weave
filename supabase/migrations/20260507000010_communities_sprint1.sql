-- Communities Sprint 1: image attachments, reply-to, load-older wiring, typing indicators
-- Typing indicators are client-side only (Supabase Realtime broadcast) — no schema needed.

-- =========================================================
-- 1. Add attachment + reply columns to messages
-- =========================================================
ALTER TABLE public.messages ALTER COLUMN body DROP NOT NULL;

ALTER TABLE public.messages DROP CONSTRAINT messages_body_len;

ALTER TABLE public.messages
  ADD COLUMN attachment_url  text,
  ADD COLUMN attachment_type text CHECK (attachment_type IN ('image')),
  ADD COLUMN reply_to_id     uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- body must be non-empty when present; at least one of body/attachment required
ALTER TABLE public.messages ADD CONSTRAINT messages_body_or_attachment CHECK (
  (body IS NOT NULL OR attachment_url IS NOT NULL)
  AND (body IS NULL OR (char_length(body) > 0 AND char_length(body) <= 2000))
);

CREATE INDEX idx_messages_reply_to ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- =========================================================
-- 2. Storage bucket for channel image attachments
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('channel-attachments', 'channel-attachments', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Paid members can upload channel attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'channel-attachments'
    AND (SELECT payment_status FROM public.users WHERE id = auth.uid()) = 'paid'
  );

CREATE POLICY "Authenticated users can view channel attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'channel-attachments');

CREATE POLICY "Users can delete their own channel attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'channel-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

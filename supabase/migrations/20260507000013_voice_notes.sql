-- Expand attachment_type to include 'voice' in both channels and DMs

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_attachment_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_attachment_type_check
  CHECK (attachment_type IN ('image', 'voice'));

ALTER TABLE public.direct_messages
  DROP CONSTRAINT IF EXISTS direct_messages_attachment_type_check;
ALTER TABLE public.direct_messages
  ADD CONSTRAINT direct_messages_attachment_type_check
  CHECK (attachment_type IN ('image', 'voice'));

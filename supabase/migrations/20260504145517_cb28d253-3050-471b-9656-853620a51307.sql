
-- 1. Rename recording_url -> video_url
ALTER TABLE public.archives RENAME COLUMN recording_url TO video_url;
ALTER TABLE public.archives ALTER COLUMN video_url DROP NOT NULL;

-- 2. Add new columns
ALTER TABLE public.archives
  ADD COLUMN content_type text NOT NULL DEFAULT 'video'
    CHECK (content_type IN ('video', 'document', 'text')),
  ADD COLUMN domain text
    CHECK (domain IS NULL OR domain IN (
      'purpose', 'money', 'mind', 'body',
      'relationships', 'career', 'spirituality'
    )),
  ADD COLUMN body_markdown text,
  ADD COLUMN document_url text,
  ADD COLUMN document_filename text,
  ADD COLUMN cover_url text,
  ADD COLUMN curator_note text
    CHECK (curator_note IS NULL OR char_length(curator_note) <= 400),
  ADD COLUMN read_time_minutes int;

-- 3. Backfill existing rows as video
UPDATE public.archives SET content_type = 'video' WHERE content_type IS NULL;

-- 4. Source validation trigger (per content_type)
CREATE OR REPLACE FUNCTION public.validate_archive_source()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.content_type = 'video' AND NEW.video_url IS NULL THEN
    RAISE EXCEPTION 'video_url is required for video archives';
  END IF;
  IF NEW.content_type = 'document' AND NEW.document_url IS NULL THEN
    RAISE EXCEPTION 'document_url is required for document archives';
  END IF;
  IF NEW.content_type = 'text' AND NEW.body_markdown IS NULL THEN
    RAISE EXCEPTION 'body_markdown is required for text archives';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_archive_source_trg ON public.archives;
CREATE TRIGGER validate_archive_source_trg
BEFORE INSERT OR UPDATE ON public.archives
FOR EACH ROW EXECUTE FUNCTION public.validate_archive_source();

-- 5. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'archive-documents', 'archive-documents', false, 52428800,
  ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'archive-covers', 'archive-covers', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies — archive-documents (private)
CREATE POLICY "Admins upload archive documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'archive-documents' AND public.is_current_user_admin());

CREATE POLICY "Admins update archive documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'archive-documents' AND public.is_current_user_admin());

CREATE POLICY "Admins delete archive documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'archive-documents' AND public.is_current_user_admin());

CREATE POLICY "Paid members read archive documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'archive-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND payment_status = 'paid'
  )
);

-- 7. Storage policies — archive-covers (public read, admin write)
CREATE POLICY "Public read archive covers"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'archive-covers');

CREATE POLICY "Admins upload archive covers"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'archive-covers' AND public.is_current_user_admin());

CREATE POLICY "Admins update archive covers"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'archive-covers' AND public.is_current_user_admin());

CREATE POLICY "Admins delete archive covers"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'archive-covers' AND public.is_current_user_admin());

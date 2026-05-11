-- Create all storage buckets needed by the app
-- Public buckets: readable by anyone, writable only by authenticated users via RLS
-- Private buckets: require signed URLs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',              'avatars',              true,  5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('profile-photos',       'profile-photos',       true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('archive-covers',       'archive-covers',       true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('event-covers',         'event-covers',         true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('channel-attachments',  'channel-attachments',  true,  104857600, NULL),
  ('playbook-attachments', 'playbook-attachments', true,  52428800,  NULL),
  ('fitness-videos',       'fitness-videos',       false, 524288000, ARRAY['video/mp4','video/quicktime','video/webm']),
  ('archive-documents',    'archive-documents',    false, 52428800,  ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users can upload to their own folder
-- Public buckets: anyone can read
CREATE POLICY "Public read avatars"             ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars"             ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Own delete avatars"              ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read profile-photos"      ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Auth upload profile-photos"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Own delete profile-photos"       ON storage.objects FOR DELETE USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read archive-covers"      ON storage.objects FOR SELECT USING (bucket_id = 'archive-covers');
CREATE POLICY "Admin upload archive-covers"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'archive-covers' AND public.is_current_user_admin());

CREATE POLICY "Public read event-covers"        ON storage.objects FOR SELECT USING (bucket_id = 'event-covers');
CREATE POLICY "Admin upload event-covers"       ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-covers' AND public.is_current_user_admin());

CREATE POLICY "Public read channel-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'channel-attachments');
CREATE POLICY "Auth upload channel-attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'channel-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Public read playbook-attachments" ON storage.objects FOR SELECT USING (bucket_id = 'playbook-attachments');
CREATE POLICY "Admin upload playbook-attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'playbook-attachments' AND public.is_current_user_admin());

-- fitness-videos: private, accessed via signed URLs
CREATE POLICY "Auth upload fitness-videos"      ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fitness-videos' AND auth.role() = 'authenticated');
CREATE POLICY "Own read fitness-videos"         ON storage.objects FOR SELECT USING (bucket_id = 'fitness-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- archive-documents: private, accessed via signed URLs (edge function)
CREATE POLICY "Admin upload archive-documents"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'archive-documents' AND public.is_current_user_admin());

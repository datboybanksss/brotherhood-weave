
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('channel-attachments', 'channel-attachments', true, 26214400)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "channel-attachments public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'channel-attachments');

CREATE POLICY "channel-attachments authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'channel-attachments');

CREATE POLICY "channel-attachments owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'channel-attachments' AND owner = auth.uid());

CREATE POLICY "channel-attachments owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'channel-attachments' AND owner = auth.uid());

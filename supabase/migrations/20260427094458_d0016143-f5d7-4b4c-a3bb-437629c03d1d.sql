REVOKE EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_unread_count(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_channel_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_count(uuid, uuid) TO authenticated;

DROP POLICY "Soft delete own or admin" ON public.messages;
CREATE POLICY "Soft delete own or admin"
ON public.messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid() OR public.is_current_user_admin())
WITH CHECK (sender_id = auth.uid() OR public.is_current_user_admin());
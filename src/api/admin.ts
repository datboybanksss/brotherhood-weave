import { supabase } from "@/lib/supabase";

export async function approveApplicant(applicantId: string) {
  const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: Error | null }> }).rpc("approve_member_request", { p_user_id: applicantId, p_interview_held: true });
  if (error) throw error;
}

export async function rejectApplicant(applicantId: string) {
  const { error } = await supabase
    .from("users")
    .update({ rejected_at: new Date().toISOString() })
    .eq("id", applicantId);
  if (error) throw error;

  // Audit log
  const { data: { user: actor } } = await supabase.auth.getUser();
  await (supabase as any).from("admin_audit_log").insert({
    actor_id: actor?.id ?? null,
    target_id: applicantId,
    action: "applicant_rejected",
    metadata: {},
  });
}

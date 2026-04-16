import { supabase } from "@/lib/supabase";

export async function approveApplicant(applicantId: string) {
  const { error } = await supabase
    .from("users")
    .update({ interview_completed: true })
    .eq("id", applicantId);
  if (error) throw error;
}

export async function rejectApplicant(applicantId: string) {
  const { error } = await supabase
    .from("users")
    .update({ rejected_at: new Date().toISOString() })
    .eq("id", applicantId);
  if (error) throw error;
}

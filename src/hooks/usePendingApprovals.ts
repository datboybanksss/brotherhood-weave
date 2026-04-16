import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PendingApplicant {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  interview_booked_at: string | null;
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async (): Promise<PendingApplicant[]> => {
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, avatar_url, created_at, interview_booked_at")
        .eq("payment_status", "pending")
        .eq("interview_completed", false)
        .eq("is_admin", false)
        .is("rejected_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as PendingApplicant[];
    },
    staleTime: 10_000,
  });
}

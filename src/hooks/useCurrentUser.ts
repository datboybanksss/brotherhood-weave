import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  tier_id: string | null;
  payment_status: "pending" | "paid";
  membership_started_at: string | null;
  interview_booked_at: string | null;
  interview_completed: boolean;
  is_admin: boolean;
  rejected_at: string | null;
  created_at: string;
  tiers: { name: string; ring_color: string; display_order: number } | null;
}

export function useCurrentUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["currentUser", user?.id],
    queryFn: async (): Promise<AppUser> => {
      console.log("Fetching current user:", user!.id);
      const { data, error } = await supabase
        .from("users")
        .select("*, tiers(name, ring_color, display_order)")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as unknown as AppUser;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

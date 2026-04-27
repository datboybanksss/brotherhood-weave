import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useVerifiedCounts() {
  const { data } = useQuery({
    queryKey: ["workoutVerifiedCounts"],
    queryFn: async () => {
      const total = await supabase.from("workouts").select("id", { count: "exact", head: true });
      const verified = await supabase.from("workouts").select("id", { count: "exact", head: true })
        .eq("verified_via", "strava");
      return { total: total.count ?? 0, verified: verified.count ?? 0 };
    },
    staleTime: 30_000,
  });
  return data ?? { total: 0, verified: 0 };
}

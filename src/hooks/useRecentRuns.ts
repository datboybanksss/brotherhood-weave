import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getRecentWorkouts } from "@/api/workouts";

export function useRecentRuns(limit = 5) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["recentWorkouts", limit],
    queryFn: () => getRecentWorkouts(limit),
    staleTime: 30_000,
  });

  useEffect(() => {
    const ch = supabase.channel(`workouts-feed:${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "workouts" }, () => {
      qc.invalidateQueries({ queryKey: ["recentWorkouts"] });
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return { runs: data ?? [], isLoading };
}

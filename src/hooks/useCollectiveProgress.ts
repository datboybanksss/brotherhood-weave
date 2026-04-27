import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import { getCollectiveDistance } from "@/api/workouts";
import { GOAL_KM, DEADLINE } from "@/lib/fitness-constants";

export function useCollectiveProgress() {
  const qc = useQueryClient();
  const { data: totalKm = 0, isLoading } = useQuery({
    queryKey: ["collectiveDistance"],
    queryFn: getCollectiveDistance,
    staleTime: 30_000,
  });

  useEffect(() => {
    const ch = supabase.channel(`workouts-total:${Math.random().toString(36).slice(2)}`);
    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "workouts" }, () => {
      qc.invalidateQueries({ queryKey: ["collectiveDistance"] });
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const percentComplete = Math.min((totalKm / GOAL_KM) * 100, 100);
  const daysRemaining = Math.max(differenceInCalendarDays(DEADLINE, new Date()), 0);
  return { totalKm, percentComplete, daysRemaining, isLoading };
}

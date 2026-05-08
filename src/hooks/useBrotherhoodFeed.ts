import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type FeedItem =
  | { kind: "workout"; id: string; user_id: string; full_name: string | null; ts: string; distance_km: number; verified: "strava" | "manual" | null; activity_type: string | null; note: string | null }
  | { kind: "submission"; id: string; user_id: string; full_name: string | null; ts: string; exercise: string; reps: number; note: string | null };

type WorkoutFeedRow = {
  id: string;
  user_id: string;
  distance_km: number | string;
  verified_via: "strava" | "manual" | null;
  activity_type: string | null;
  note: string | null;
  created_at: string;
  users?: { full_name: string | null } | null;
};

type SubmissionFeedRow = {
  id: string;
  user_id: string;
  exercise: string;
  reps: number;
  note: string | null;
  submitted_at: string;
  users?: { full_name: string | null } | null;
};

export function useBrotherhoodFeed(limit = 30) {
  return useQuery({
    queryKey: ["brotherhoodFeed", limit],
    queryFn: async (): Promise<FeedItem[]> => {
      const [w, s] = await Promise.all([
        supabase.from("workouts").select("id, user_id, distance_km, verified_via, activity_type, note, created_at, users!user_id(full_name)").order("created_at", { ascending: false }).limit(50),
        supabase.from("submissions").select("id, user_id, exercise, reps, note, submitted_at, users!user_id(full_name)").order("submitted_at", { ascending: false }).limit(50),
      ]);
      if (w.error) throw w.error;
      if (s.error) throw s.error;
      const workouts = (w.data ?? []) as unknown as WorkoutFeedRow[];
      const submissions = (s.data ?? []) as unknown as SubmissionFeedRow[];
      const items: FeedItem[] = [
        ...workouts.map((r): FeedItem => ({ kind: "workout", id: r.id, user_id: r.user_id, full_name: r.users?.full_name ?? null, ts: r.created_at, distance_km: Number(r.distance_km), verified: r.verified_via, activity_type: r.activity_type, note: r.note ?? null })),
        ...submissions.map((r): FeedItem => ({ kind: "submission", id: r.id, user_id: r.user_id, full_name: r.users?.full_name ?? null, ts: r.submitted_at, exercise: r.exercise, reps: r.reps, note: r.note ?? null })),
      ];
      items.sort((a, b) => b.ts.localeCompare(a.ts));
      return items.slice(0, limit);
    },
    staleTime: 30_000,
  });
}

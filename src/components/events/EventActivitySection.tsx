import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Avatar from "@/components/Avatar";
import { CheckCircle2 } from "lucide-react";
import { getEventActivity } from "@/api/events";
import { EXERCISE_MAP } from "@/lib/exercises";

export default function EventActivitySection({ eventId, dateISO }: { eventId: string; dateISO: string }) {
  const { data } = useQuery({ queryKey: ["eventActivity", eventId], queryFn: () => getEventActivity(eventId, dateISO), staleTime: 60_000 });
  if (!data) return null;
  const items = [
    ...data.workouts.map((r: any) => ({ kind: "w" as const, ts: r.created_at, ...r })),
    ...data.submissions.map((r: any) => ({ kind: "s" as const, ts: r.submitted_at, ...r })),
  ].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 20);
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Activity that day</h3>
      {items.map((it: any) => {
        const first = (it.users?.full_name ?? "Member").split(" ")[0];
        return (
          <Link to={`/member/${it.user_id}`} key={`${it.kind}-${it.id}`} className="flex items-center gap-2 text-sm">
            <Avatar userId={it.user_id} size="sm" />
            <span className="font-medium">{first}</span>
            {it.kind === "w" ? (
              <span className="text-muted-foreground flex items-center gap-1">
                ran <span className="font-bold text-foreground">{Number(it.distance_km).toFixed(1)} km</span>
                {it.verified_via === "strava" && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "hsl(24 95% 53%)" }} />}
              </span>
            ) : (
              <span className="text-muted-foreground">logged <span className="font-bold text-foreground">{it.reps} {EXERCISE_MAP[it.exercise as keyof typeof EXERCISE_MAP]?.label ?? it.exercise}</span></span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

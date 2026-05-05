import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import { EXERCISE_MAP } from "@/lib/exercises";
import type { FeedItem } from "@/hooks/useBrotherhoodFeed";

export default function ActivityFeedRow({ item }: { item: FeedItem }) {
  const first = (item.full_name ?? "Member").split(" ")[0];
  return (
    <div className="flex items-start gap-3">
      <Link to={`/member/${item.user_id}`}><Avatar userId={item.user_id} size="sm" /></Link>
      <div className="flex-1 min-w-0 text-sm">
        <Link to={`/member/${item.user_id}`} className="font-medium hover:underline">{first}</Link>{" "}
        {item.kind === "workout" ? (
          <>
            <span className="text-muted-foreground">ran</span> <span className="font-bold">{item.distance_km.toFixed(1)} km</span>
            {item.verified === "strava" && <CheckCircle2 className="inline w-3.5 h-3.5 ml-1" style={{ color: "hsl(24 95% 53%)" }} />}
          </>
        ) : (
          <><span className="text-muted-foreground">logged</span> <span className="font-bold">{item.reps} {EXERCISE_MAP[item.exercise as keyof typeof EXERCISE_MAP]?.label ?? item.exercise}</span></>
        )}
        <span className="text-muted-foreground"> · {formatDistanceToNowStrict(new Date(item.ts), { addSuffix: true })}</span>
      </div>
    </div>
  );
}

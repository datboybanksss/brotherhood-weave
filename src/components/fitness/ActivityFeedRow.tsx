import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { CheckCircle2, Footprints } from "lucide-react";
import Avatar from "@/components/Avatar";
import EmojiIcon from "@/components/EmojiIcon";
import { EXERCISE_MAP, formatRepsLabel, type ExerciseKey } from "@/lib/exercises";
import type { FeedItem } from "@/hooks/useBrotherhoodFeed";

export default function ActivityFeedRow({ item }: { item: FeedItem }) {
  const first = (item.full_name ?? "Member").split(" ")[0];
  const exerciseKey = item.kind === "submission" && item.exercise in EXERCISE_MAP ? item.exercise as ExerciseKey : null;
  const exercise = exerciseKey ? EXERCISE_MAP[exerciseKey] : null;
  return (
    <div className="flex items-start gap-3 px-1 py-1.5">
      <Link to={`/member/${item.user_id}`}><Avatar userId={item.user_id} size="sm" /></Link>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border border-stroke-hairline bg-surface-white">
        {item.kind === "submission" && exercise ? (
          <EmojiIcon cp={exercise.emoji.cp} alt={exercise.emoji.alt} size={17} />
        ) : (
          <Footprints className="h-4 w-4 text-text-muted" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex-1 min-w-0 text-sm">
        <div className="leading-snug">
          <Link to={`/member/${item.user_id}`} className="font-semibold hover:underline">{first}</Link>{" "}
          {item.kind === "workout" ? (
            <>
              <span className="text-muted-foreground">ran</span> <span className="font-bold">{item.distance_km.toFixed(1)} km</span>
              {item.verified === "strava" && <CheckCircle2 className="inline w-3.5 h-3.5 ml-1 align-[-2px]" style={{ color: "hsl(24 95% 53%)" }} />}
            </>
          ) : (
            <><span className="text-muted-foreground">logged</span> <span className="font-bold">{exerciseKey ? formatRepsLabel(exerciseKey, item.reps) : item.reps} {exercise?.label ?? item.exercise}</span></>
          )}
          <span className="text-muted-foreground"> · {formatDistanceToNowStrict(new Date(item.ts), { addSuffix: true })}</span>
        </div>
        {item.note && (
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">"{item.note}"</p>
        )}
      </div>
    </div>
  );
}

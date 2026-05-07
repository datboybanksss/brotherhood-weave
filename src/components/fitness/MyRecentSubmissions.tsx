import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Video } from "lucide-react";
import { getMyRecentSubmissions } from "@/api/submissions";
import { EXERCISE_MAP, formatRepsLabel } from "@/lib/exercises";
import EmojiIcon from "@/components/EmojiIcon";

export default function MyRecentSubmissions() {
  const { data } = useQuery({
    queryKey: ["myRecentSubmissions"],
    queryFn: () => getMyRecentSubmissions(5),
    staleTime: 30_000,
  });
  if (!data) return null;
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No activities yet — log your first.</p>;
  }
  return (
    <ul className="space-y-2">
      {data.map((s) => {
        const meta = EXERCISE_MAP[s.exercise];
        return (
          <li key={s.id} className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2">
              <EmojiIcon cp={meta.emoji.cp} alt={meta.emoji.alt} size={16} />
              <span className="font-medium">{meta.label}</span>
              <span className="text-muted-foreground">· {formatRepsLabel(s.exercise, s.reps)}</span>
              {s.video_url && <Video className="h-3.5 w-3.5 text-primary" />}
            </span>
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.submitted_at), { addSuffix: true })}</span>
          </li>
        );
      })}
    </ul>
  );
}

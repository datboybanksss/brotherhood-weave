import { useState } from "react";
import { format } from "date-fns";
import { Lock, Video } from "lucide-react";
import { EXERCISE_MAP, formatRepsLabel } from "@/lib/exercises";
import type { SignedSubmission } from "@/api/fitness";
import VideoPlayer from "./VideoPlayer";
import EmojiIcon from "@/components/EmojiIcon";

export default function FitnessActivityRow({ s }: { s: SignedSubmission }) {
  const [open, setOpen] = useState(false);
  const meta = EXERCISE_MAP[s.exercise];
  const playable = !!s.video_url;
  const locked = s.video_locked;

  return (
    <div className="py-2 border-b last:border-b-0">
      <button
        onClick={() => playable && setOpen((v) => !v)}
        disabled={!playable}
        className="w-full flex items-center justify-between gap-2 text-left disabled:cursor-default"
      >
        <span className="inline-flex items-center gap-2 min-w-0">
          <EmojiIcon cp={meta.emoji.cp} alt={meta.emoji.alt} size={16} />
          <span className="text-sm font-medium truncate">{meta.label}</span>
          <span className="text-sm text-muted-foreground">· {formatRepsLabel(s.exercise, s.reps)}</span>
          {playable && <Video className="h-3.5 w-3.5 text-primary shrink-0" />}
          {locked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">{format(new Date(s.submitted_at), "MMM d")}</span>
      </button>
      {s.note && <p className="text-xs italic text-muted-foreground mt-1">{s.note}</p>}
      {open && s.video_url && <VideoPlayer src={s.video_url} />}
    </div>
  );
}

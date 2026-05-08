import { useNavigate } from "react-router-dom";
import Avatar from "@/components/Avatar";
import type { LeaderboardRow as Row } from "@/api/fitness";
import { cn } from "@/lib/utils";
import RankMedal, { medalForRank } from "./RankMedal";

export default function LeaderboardRow({ row, rank, isMe }: { row: Row; rank: number; isMe: boolean }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav(`/member/${row.user_id}`)}
      className={cn(
        "w-full flex items-center gap-3 p-2 hover:bg-brand-royal-tint transition-colors text-left",
        isMe && "bg-brand-royal-tint ring-1 ring-brand-royal/20",
      )}
    >
      <span className="w-6 text-sm font-semibold text-muted-foreground text-center inline-flex items-center justify-center">
        {medalForRank(rank) ? <RankMedal rank={rank} className="h-5 w-5" /> : rank}
      </span>
      <Avatar userId={row.user_id} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {row.full_name}{isMe && <span className="text-xs text-muted-foreground"> (you)</span>}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {row.total_reps} reps · {row.submission_count} submissions · {row.video_count} videos
        </div>
      </div>
      <div className="text-sm font-semibold tabular-nums">{row.score}</div>
    </button>
  );
}

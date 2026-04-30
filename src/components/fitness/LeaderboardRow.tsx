import { useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import Avatar from "@/components/Avatar";
import type { LeaderboardRow as Row } from "@/api/fitness";
import { cn } from "@/lib/utils";

const crownColor = (rank: number) =>
  rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-700" : "";

export default function LeaderboardRow({ row, rank, isMe }: { row: Row; rank: number; isMe: boolean }) {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav(`/member/${row.user_id}`)}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left",
        isMe && "bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <span className="w-6 text-sm font-semibold text-muted-foreground text-center inline-flex items-center justify-center">
        {rank <= 3 ? <Crown className={cn("h-4 w-4", crownColor(rank))} /> : rank}
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
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useRecentRuns } from "@/hooks/useRecentRuns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EmojiIcon from "@/components/EmojiIcon";

export default function RecentRunsFeed() {
  const { runs, isLoading } = useRecentRuns(5);
  if (isLoading) return <div className="text-sm text-muted-foreground py-2">Loading…</div>;
  if (runs.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No runs logged yet — be the first.</div>;
  }
  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {runs.map((r) => {
          const firstName = r.users?.full_name?.split(" ")[0] ?? "Member";
          const actCp = r.activity_type === "Walk" ? "1f6b6" : r.activity_type === "Run" ? "1f3c3" : null;
          return (
            <div key={r.id} className="flex items-start gap-3">
              <Link to={`/member/${r.user_id}`}><Avatar userId={r.user_id} size="sm" /></Link>
              <div className="flex-1 min-w-0">
                <div className="text-sm flex items-center gap-1.5 flex-wrap">
                  <Link to={`/member/${r.user_id}`} className="font-medium hover:underline">{firstName}</Link>
                  <span className="text-muted-foreground">ran</span>
                  {actCp && <EmojiIcon cp={actCp} alt={r.activity_type ?? ""} size={14} />}
                  <span className="font-bold">{r.distance_km.toFixed(1)} km</span>
                  {r.verified_via === "strava" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "hsl(24 95% 53%)" }} aria-label="Verified via Strava" />
                      </TooltipTrigger>
                      <TooltipContent>Verified via Strava</TooltipContent>
                    </Tooltip>
                  )}
                  {r.verified_via === "manual" && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">manual</span>
                  )}
                  <span className="text-muted-foreground">· {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                </div>
                {r.note && <div className="text-xs italic text-muted-foreground mt-0.5">{r.note}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

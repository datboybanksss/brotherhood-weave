import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Avatar from "@/components/Avatar";
import { useRecentRuns } from "@/hooks/useRecentRuns";

export default function RecentRunsFeed() {
  const { runs, isLoading } = useRecentRuns(5);
  if (isLoading) return <div className="text-sm text-muted-foreground py-2">Loading…</div>;
  if (runs.length === 0) {
    return <div className="text-sm text-muted-foreground py-2">No runs logged yet — be the first.</div>;
  }
  return (
    <div className="space-y-3">
      {runs.map((r) => {
        const firstName = r.users?.full_name?.split(" ")[0] ?? "Member";
        return (
          <div key={r.id} className="flex items-start gap-3">
            <Link to={`/member/${r.user_id}`}><Avatar userId={r.user_id} size="sm" /></Link>
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <Link to={`/member/${r.user_id}`} className="font-medium hover:underline">{firstName}</Link>
                <span className="text-muted-foreground"> ran </span>
                <span className="font-bold">{r.distance_km.toFixed(1)} km</span>
                <span className="text-muted-foreground"> · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
              </div>
              {r.note && <div className="text-xs italic text-muted-foreground mt-0.5">{r.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

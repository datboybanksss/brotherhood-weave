// Forfeit week: Mon 00:00 -> Sun 23:59 in SAST. List goes live Wed 00:00 SAST.
// Anchor to SAST (UTC+2, no DST) before computing - at year boundaries SAST and UTC dates can differ.
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForfeitList } from "@/hooks/useForfeitList";
import { currentSastMondayISO, currentSastDayOfWeek } from "@/api/fitness";
import { useAuth } from "@/hooks/useAuth";
import ForfeitRow from "./ForfeitRow";

export default function ForfeitWatchlist() {
  const weekStart = currentSastMondayISO();
  const dow = currentSastDayOfWeek();
  const { user } = useAuth();
  const liveYet = dow >= 3;
  const { data } = useForfeitList(weekStart, liveYet);
  const weekLabel = format(new Date(weekStart), "MMM d");
  const userIsListed = !!user?.id && !!data?.some((row) => row.user_id === user.id);

  // Hide entirely Sun-Tue (0,1,2). Show Wed-Sat (3-6).
  if (dow < 3) return null;

  return (
    <Card className="border border-brand-royal/20 bg-surface-white">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Forfeit watchlist</CardTitle>
            <p className="text-xs text-text-muted mt-1">Week of {weekLabel}</p>
          </div>
          {data && (
            <div className={`flex items-center gap-1.5 rounded-pill border px-2 py-1 text-xs font-medium ${
              userIsListed ? "border-state-danger/30 bg-state-danger/10 text-state-danger" : "border-brand-royal/20 bg-brand-royal-tint text-brand-royal"
            }`}>
              {userIsListed ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {userIsListed ? "You're on it" : "You're safe"}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!liveYet ? (
          <p className="text-sm text-muted-foreground italic">The forfeit list goes live Wednesday.</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every brother has logged this week.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Brothers without a submission this week. The Saturday call sees this list.
            </p>
            <div className="divide-y">
              {data.map((r) => <ForfeitRow key={r.user_id} row={r} isCurrentUser={r.user_id === user?.id} />)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

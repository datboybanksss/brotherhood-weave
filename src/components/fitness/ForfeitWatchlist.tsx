// Forfeit week: Mon 00:00 -> Sun 23:59 in SAST. List goes live Wed 00:00 SAST.
// Anchor to SAST (UTC+2, no DST) before computing - at year boundaries SAST and UTC dates can differ.
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForfeitList } from "@/hooks/useForfeitList";
import { currentSastMondayISO, currentSastDayOfWeek } from "@/api/fitness";
import ForfeitRow from "./ForfeitRow";

export default function ForfeitWatchlist() {
  const weekStart = currentSastMondayISO();
  const dow = currentSastDayOfWeek();
  // Hide entirely Sun-Tue (0,1,2). Show Wed-Sat (3-6).
  if (dow < 3) return null;
  const liveYet = dow === 0 || dow >= 3;
  const { data } = useForfeitList(weekStart, liveYet);
  const weekLabel = format(new Date(weekStart), "MMM d");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Forfeit Watchlist — week of {weekLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        {!liveYet ? (
          <p className="text-sm text-muted-foreground italic">The forfeit list goes live Wednesday.</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every brother has logged this week. 🤝</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              Brothers without a submission this week. The Saturday call sees this list.
            </p>
            <div className="divide-y">
              {data.map((r) => <ForfeitRow key={r.user_id} row={r} />)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

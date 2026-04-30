import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFitnessLeaderboard } from "@/hooks/useFitnessLeaderboard";
import { currentMonthStartISO } from "@/api/fitness";
import { useAuth } from "@/hooks/useAuth";
import LeaderboardRow from "./LeaderboardRow";

export default function MonthlyLeaderboard() {
  const monthStart = currentMonthStartISO();
  const { data, isLoading } = useFitnessLeaderboard(monthStart);
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const monthName = useMemo(
    () => new Date(monthStart).toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
    [monthStart],
  );
  const top = (data ?? []).slice(0, showAll ? undefined : 10);
  const myIdx = (data ?? []).findIndex((r) => r.user_id === user?.id);
  const meOutsideTop = !showAll && myIdx >= 10;

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{monthName} Leaderboard</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Be the first to log.</p>
        )}
        {top.map((row, i) => (
          <LeaderboardRow key={row.user_id} row={row} rank={i + 1} isMe={row.user_id === user?.id} />
        ))}
        {meOutsideTop && data && (
          <>
            <div className="text-center text-xs text-muted-foreground py-1">…</div>
            <LeaderboardRow row={data[myIdx]} rank={myIdx + 1} isMe />
          </>
        )}
        {data && data.length > 10 && (
          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show top 10" : `Show all (${data.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
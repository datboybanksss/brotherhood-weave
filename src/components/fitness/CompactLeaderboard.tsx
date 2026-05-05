import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFitnessLeaderboard } from "@/hooks/useFitnessLeaderboard";
import { currentMonthStartISO } from "@/api/fitness";
import { useAuth } from "@/hooks/useAuth";
import LeaderboardRow from "./LeaderboardRow";

export default function CompactLeaderboard() {
  const monthStart = currentMonthStartISO();
  const { data } = useFitnessLeaderboard(monthStart);
  const { user } = useAuth();
  const [showAll, setShowAll] = useState(false);
  const monthName = new Date(monthStart).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const top = (data ?? []).slice(0, showAll ? undefined : 5);
  const myIdx = (data ?? []).findIndex((r) => r.user_id === user?.id);
  const meOutside = !showAll && myIdx >= 5;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{monthName} Leaderboard</CardTitle></CardHeader>
      <CardContent className="space-y-1">
        {top.map((row, i) => <LeaderboardRow key={row.user_id} row={row} rank={i + 1} isMe={row.user_id === user?.id} />)}
        {meOutside && data && (<><div className="text-center text-xs text-muted-foreground py-1">…</div><LeaderboardRow row={data[myIdx]} rank={myIdx + 1} isMe /></>)}
        {data && data.length > 5 && <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show top 5" : "View full"}</Button>}
      </CardContent>
    </Card>
  );
}

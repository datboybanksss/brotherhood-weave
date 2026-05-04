import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LogActivityDialog from "@/components/fitness/LogActivityDialog";
import MyRecentSubmissions from "@/components/fitness/MyRecentSubmissions";
import MonthlyLeaderboard from "@/components/fitness/MonthlyLeaderboard";
import ForfeitWatchlist from "@/components/fitness/ForfeitWatchlist";
import RecentRunsFeed from "@/components/home/RecentRunsFeed";
import { getMyWeeklySubmissionCount } from "@/api/submissions";
import { currentSastMondayISO } from "@/api/fitness";

export default function Fitness() {
  const weekStart = currentSastMondayISO();
  const location = useLocation();
  const { data: weekCount } = useQuery({
    queryKey: ["myWeeklyCount", weekStart],
    queryFn: () => getMyWeeklySubmissionCount(weekStart),
    staleTime: 30_000,
  });

  useEffect(() => {
    const id = location.hash.replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      <Card id="challenge" className="scroll-mt-20">
        <CardHeader className="pb-2"><CardTitle className="text-base">Log activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LogActivityDialog trigger={
            <Button className="w-full"><Plus className="w-4 h-4 mr-2" />Log new activity</Button>
          } />
          <p className="text-xs text-muted-foreground">
            {weekCount ?? 0} {weekCount === 1 ? "activity" : "activities"} logged this week
          </p>
          <div>
            <div className="text-sm font-medium mb-2">This week's submissions</div>
            <MyRecentSubmissions />
          </div>
        </CardContent>
      </Card>
      <MonthlyLeaderboard />
      <ForfeitWatchlist />
      <Card id="runs" className="scroll-mt-20">
        <CardHeader className="pb-2"><CardTitle className="text-base">Latest runs from the brotherhood</CardTitle></CardHeader>
        <CardContent>
          <RecentRunsFeed />
        </CardContent>
      </Card>
    </div>
  );
}
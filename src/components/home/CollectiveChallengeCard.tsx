import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CircularProgress from "./CircularProgress";
import LogRunDialog from "./LogRunDialog";
import RecentRunsFeed from "./RecentRunsFeed";
import { useCollectiveProgress } from "@/hooks/useCollectiveProgress";
import { GOAL_KM } from "@/lib/fitness-constants";

export default function CollectiveChallengeCard() {
  const { totalKm, daysRemaining } = useCollectiveProgress();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Brotherhood Challenge — 100km by June 16</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          <CircularProgress value={totalKm} max={GOAL_KM} />
          {daysRemaining > 0 && (
            <div className="text-xs text-muted-foreground mt-2">{daysRemaining} days remaining</div>
          )}
        </div>
        <LogRunDialog trigger={<Button className="w-full"><Plus className="w-4 h-4 mr-2" />Log a run</Button>} />
        <div>
          <div className="text-sm font-medium mb-2">Latest from the brotherhood</div>
          <RecentRunsFeed />
        </div>
      </CardContent>
    </Card>
  );
}

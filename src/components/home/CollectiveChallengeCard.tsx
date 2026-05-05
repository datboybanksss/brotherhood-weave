import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Activity } from "lucide-react";
import { toast } from "sonner";
import CircularProgress from "./CircularProgress";
import LogRunDialog from "./LogRunDialog";
import { stopTile } from "./BentoGrid";
import { useCollectiveProgress } from "@/hooks/useCollectiveProgress";
import { useStravaConnection } from "@/hooks/useStravaConnection";
import { useVerifiedCounts } from "@/hooks/useVerifiedCounts";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { GOAL_KM } from "@/lib/fitness-constants";
import { buildStravaAuthorizeUrl, triggerStravaSync } from "@/api/strava";

export default function CollectiveChallengeCard() {
  const { totalKm, daysRemaining } = useCollectiveProgress();
  const { connection } = useStravaConnection();
  const { data: user } = useCurrentUser();
  const { total, verified } = useVerifiedCounts();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const onConnect = () => {
    if (!user) return;
    const nonce = crypto.randomUUID();
    sessionStorage.setItem("strava_oauth_nonce", nonce);
    window.location.assign(buildStravaAuthorizeUrl(user.id, nonce));
  };

  const onSync = async () => {
    setBusy(true);
    const { data, error } = await triggerStravaSync();
    setBusy(false);
    if (error) { toast.error(`Sync failed: ${error.message}`); return; }
    toast.success(`Imported ${data?.imported ?? 0}, skipped ${data?.skipped ?? 0}.`);
    qc.invalidateQueries({ queryKey: ["recentWorkouts"] });
    qc.invalidateQueries({ queryKey: ["collectiveDistance"] });
    qc.invalidateQueries({ queryKey: ["workoutVerifiedCounts"] });
    qc.invalidateQueries({ queryKey: ["stravaConnection"] });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-foreground">100km Challenge by June 16</div>
      <div className="flex flex-col items-center">
        <CircularProgress value={totalKm} max={GOAL_KM} />
        {daysRemaining > 0 && (
          <div className="text-xs text-muted-foreground mt-2">{daysRemaining} days remaining</div>
        )}
        {verified > 0 && (
          <div className="text-xs text-muted-foreground mt-1">{verified} of {total} verified via Strava</div>
        )}
      </div>
      <div className="space-y-2" onClick={stopTile}>
        {connection ? (
          <Button className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white" onClick={onSync} disabled={busy}>
            <RefreshCw className={`w-4 h-4 mr-2 ${busy ? "animate-spin" : ""}`} /> Sync from Strava
          </Button>
        ) : (
          <Button className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white" onClick={onConnect}>
            <Activity className="w-4 h-4 mr-2" /> Connect Strava
          </Button>
        )}
        <LogRunDialog trigger={
          <Button variant="outline" className="w-full"><Plus className="w-4 h-4 mr-2" />Log a run manually</Button>
        } />
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStravaConnection } from "@/hooks/useStravaConnection";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { buildStravaAuthorizeUrl, disconnectStrava, triggerStravaSync } from "@/api/strava";

export default function StravaConnection() {
  const { connection, isLoading } = useStravaConnection();
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  if (isLoading || !user) return null;

  const onConnect = () => {
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
    qc.invalidateQueries({ queryKey: ["stravaConnection"] });
    qc.invalidateQueries({ queryKey: ["recentWorkouts"] });
    qc.invalidateQueries({ queryKey: ["collectiveDistance"] });
  };

  const onDisconnect = async () => {
    const { error } = await disconnectStrava();
    if (error) { toast.error(error.message); return; }
    toast.success("Strava disconnected.");
    qc.invalidateQueries({ queryKey: ["stravaConnection"] });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" /> Connected apps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!connection ? (
          <>
            <p className="text-sm text-muted-foreground">Connect Strava to auto-import your runs and walks.</p>
            <Button className="w-full" onClick={onConnect}>Connect Strava</Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(142 71% 45%)" }} />
              <span className="font-medium">Strava connected</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Last synced {connection.last_synced_at
                ? `${formatDistanceToNow(new Date(connection.last_synced_at), { addSuffix: true })}`
                : "never"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={onSync} disabled={busy}>
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${busy ? "animate-spin" : ""}`} /> Sync now
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">Disconnect</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect Strava?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This stops auto-import. Existing imported runs stay. To fully revoke access,
                      visit your Strava settings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDisconnect}>Disconnect</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import { Users } from "lucide-react";
import { format } from "date-fns";
import { getNextMondayDate } from "@/api/peers";

export default function PeerPartnerCardWaiting() {
  const nextMon = getNextMondayDate();
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Your peer is on the way</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        You'll be matched with your first peer on Monday {format(nextMon, "MMM d")}. The brotherhood meets every week — we want you to know each one.
      </p>
    </div>
  );
}

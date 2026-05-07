import { format } from "date-fns";
import { getNextMondayDate } from "@/api/peers";
import EmojiIcon from "@/components/EmojiIcon";

export default function PeerPartnerCardWaiting() {
  const nextMon = getNextMondayDate();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <EmojiIcon cp="1f465" alt="People" size={20} />
        <h2 className="text-sm font-semibold text-foreground">Your peer is on the way</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        You'll be matched with your first peer on Monday {format(nextMon, "MMM d")}. The brotherhood meets every week — we want you to know each one.
      </p>
    </div>
  );
}

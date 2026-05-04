import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import type { PartnerInfo } from "@/api/peers";

interface Props { partner: PartnerInfo; weekEnd: Date }

export default function PeerPartnerCardSingle({ partner, weekEnd }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Your peer this week</h2>
      <div className="flex flex-col items-center text-center space-y-2">
        <Avatar userId={partner.id} size="lg" />
        <p className="text-lg font-bold text-foreground">{partner.full_name}</p>
        {partner.primary_department && (
          <p className="text-xs text-muted-foreground">{partner.primary_department}</p>
        )}
        {partner.bio && (
          <p className="text-sm italic text-muted-foreground line-clamp-2">{partner.bio}</p>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Tap to view profile · Until Sunday {format(weekEnd, "MMM d")}
      </p>
    </div>
  );
}

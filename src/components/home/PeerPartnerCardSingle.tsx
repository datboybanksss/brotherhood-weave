import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import type { PartnerInfo } from "@/api/peers";

interface Props { partner: PartnerInfo; weekEnd: Date }

export default function PeerPartnerCardSingle({ partner, weekEnd }: Props) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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
      <Button className="w-full" onClick={() => navigate(`/member/${partner.id}`)}>
        View profile
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Until Sunday {format(weekEnd, "MMM d")}
      </p>
    </div>
  );
}

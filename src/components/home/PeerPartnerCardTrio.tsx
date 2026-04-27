import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import type { PartnerInfo } from "@/api/peers";

interface Props { partners: PartnerInfo[]; weekEnd: Date }

export default function PeerPartnerCardTrio({ partners, weekEnd }: Props) {
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">Your peers this week</h2>
        <p className="text-xs text-muted-foreground">
          You're a trio this week — odd numbers mean three of you connect together. Meet as a group.
        </p>
      </div>
      <div className="space-y-3">
        {partners.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/member/${p.id}`)}
            className="w-full flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors text-left"
          >
            <Avatar userId={p.id} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground truncate">{p.full_name}</p>
              {p.primary_department && (
                <p className="text-xs text-muted-foreground">{p.primary_department}</p>
              )}
            </div>
            <span className="text-xs text-primary">View</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Until Sunday {format(weekEnd, "MMM d")}
      </p>
    </div>
  );
}

import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useCurrentPeerPartner } from "@/hooks/useCurrentPeerPartner";

export default function PulsePeerCard() {
  const { data } = useCurrentPeerPartner();
  const partners = data?.partners ?? [];
  const weekEnd = data?.weekEnd;

  return (
    <div className="rounded-2xl border border-stroke-hairline bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-brand-royal" />
        <p className="text-xs uppercase tracking-wide text-text-muted font-medium">Your peer this week</p>
      </div>
      {partners.length === 0 ? (
        <p className="text-sm text-text-muted">Pairings run every Sunday — check back then.</p>
      ) : (
        <>
          <div className="flex gap-4">
            {partners.map((p) => (
              <Link
                key={p.id}
                to={`/member/${p.id}`}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <Avatar userId={p.id} size="md" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.full_name.split(" ")[0]}</p>
                  {p.primary_department && (
                    <p className="text-xs text-text-muted truncate">{p.primary_department}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {weekEnd && (
            <p className="text-xs text-text-muted">Until Sunday {format(weekEnd, "MMM d")}</p>
          )}
        </>
      )}
    </div>
  );
}

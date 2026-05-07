import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Avatar from "@/components/Avatar";
import { useCurrentPeerPartner } from "@/hooks/useCurrentPeerPartner";
import { getOrCreateConversation } from "@/api/direct-messages";
import { toast } from "sonner";
import EmojiIcon from "@/components/EmojiIcon";

export default function PulsePeerCard() {
  const { data } = useCurrentPeerPartner();
  const partners = data?.partners ?? [];
  const weekEnd = data?.weekEnd;
  const nav = useNavigate();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleMessage = async (partnerId: string) => {
    setLoadingId(partnerId);
    try {
      const convId = await getOrCreateConversation(partnerId);
      nav(`/messages/${convId}`);
    } catch {
      toast.error("Could not open conversation");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-stroke-hairline bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <EmojiIcon cp="1f465" alt="People" size={16} />
        <p className="text-xs uppercase tracking-wide text-text-muted font-medium">Your peer this week</p>
      </div>
      {partners.length === 0 ? (
        <p className="text-sm text-text-muted">Pairings run every Sunday — check back then.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Link
                  to={`/member/${p.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <Avatar userId={p.id} size="md" showStatus />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{p.full_name.split(" ")[0]}</p>
                    {p.primary_department && (
                      <p className="text-xs text-text-muted truncate">{p.primary_department}</p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => handleMessage(p.id)}
                  disabled={loadingId === p.id}
                  className="p-2 rounded-full hover:bg-accent disabled:opacity-40 shrink-0"
                  aria-label={`Message ${p.full_name.split(" ")[0]}`}
                >
                  <EmojiIcon cp="1f4ac" alt="Message" size={18} />
                </button>
              </div>
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

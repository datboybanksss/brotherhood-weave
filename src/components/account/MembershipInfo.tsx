import { format } from "date-fns";
import TierBadge from "@/components/TierBadge";
import type { AppUser } from "@/hooks/useCurrentUser";

export default function MembershipInfo({ user }: { user: AppUser }) {
  if (user.payment_status !== "paid" || !user.tiers) return null;

  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <h2 className="text-sm font-semibold text-foreground">Membership</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground">{user.tiers.name}</span>
        <TierBadge name={user.tiers.name} ringColor={user.tiers.ring_color} />
      </div>
      {user.membership_started_at && (
        <p className="text-xs text-muted-foreground">
          Member since {format(new Date(user.membership_started_at), "PPP")}
        </p>
      )}
    </div>
  );
}

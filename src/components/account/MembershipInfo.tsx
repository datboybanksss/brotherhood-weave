import { format } from "date-fns";
import TierBadge from "@/components/TierBadge";
import type { AppUser } from "@/hooks/useCurrentUser";

export default function MembershipInfo({ user }: { user: AppUser }) {
  if (user.payment_status !== "paid" || !user.tier_id) return null;

  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <h2 className="text-sm font-semibold text-foreground">Membership</h2>
      <TierBadge tierId={user.tier_id} />
      {user.membership_started_at && (
        <p className="text-xs text-muted-foreground">
          Member since {format(new Date(user.membership_started_at), "PPP")}
        </p>
      )}
    </div>
  );
}

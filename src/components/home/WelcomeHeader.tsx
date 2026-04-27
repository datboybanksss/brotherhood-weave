import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
import type { AppUser } from "@/hooks/useCurrentUser";

export default function WelcomeHeader({ user }: { user: AppUser }) {
  return (
    <div className="flex flex-col items-center text-center space-y-2">
      <Avatar userId={user.id} size="md" />
      <h1 className="text-base font-semibold text-foreground">Welcome, {user.full_name}</h1>
      {user.tier_id && <TierBadge tierId={user.tier_id} />}
    </div>
  );
}

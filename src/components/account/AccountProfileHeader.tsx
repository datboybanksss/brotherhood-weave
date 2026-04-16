import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
import type { AppUser } from "@/hooks/useCurrentUser";

export default function AccountProfileHeader({ user }: { user: AppUser }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar userId={user.id} size="xl" />
      <h1 className="text-xl font-bold text-foreground">{user.full_name}</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      {user.tier_id && <TierBadge tierId={user.tier_id} />}
    </div>
  );
}

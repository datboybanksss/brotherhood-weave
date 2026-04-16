import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";
import type { AppUser } from "@/hooks/useCurrentUser";

export default function AccountProfileHeader({ user }: { user: AppUser }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar
        src={user.avatar_url}
        fallbackName={user.full_name}
        size="xl"
        ringColor={user.tiers?.ring_color}
      />
      <h1 className="text-xl font-bold text-foreground">{user.full_name}</h1>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      {user.tiers && <TierBadge name={user.tiers.name} ringColor={user.tiers.ring_color} />}
    </div>
  );
}

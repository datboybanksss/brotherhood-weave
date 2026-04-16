import { useCurrentUser } from "@/hooks/useCurrentUser";
import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";

export default function ProfileHeader() {
  const { data: appUser } = useCurrentUser();
  if (!appUser) return null;

  return (
    <div className="flex flex-col items-center space-y-3 pt-4">
      <Avatar userId={appUser.id} size="xl" />
      <h2 className="text-lg font-bold text-foreground">{appUser.full_name}</h2>
      {appUser.tier_id && <TierBadge tierId={appUser.tier_id} />}
      <p className="text-sm text-muted-foreground">{appUser.email}</p>
    </div>
  );
}

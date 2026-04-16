import { useCurrentUser } from "@/hooks/useCurrentUser";
import Avatar from "@/components/Avatar";
import TierBadge from "@/components/TierBadge";

export default function Home() {
  const { data: appUser } = useCurrentUser();

  if (!appUser) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col items-center space-y-3 pt-8">
        <Avatar userId={appUser.id} size="lg" />
        <h1 className="text-xl font-bold text-foreground">Welcome, {appUser.full_name}</h1>
        {appUser.tier_id && <TierBadge tierId={appUser.tier_id} />}
      </div>
    </div>
  );
}

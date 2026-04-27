import { useCurrentUser } from "@/hooks/useCurrentUser";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import PeerPartnerCard from "@/components/home/PeerPartnerCard";
import TierProgressMini from "@/components/home/TierProgressMini";

export default function Home() {
  const { data: appUser } = useCurrentUser();
  if (!appUser) return null;

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      <WelcomeHeader user={appUser} />
      <PeerPartnerCard />
      <TierProgressMini />
    </div>
  );
}

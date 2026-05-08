import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentPeerPartner } from "@/hooks/useCurrentPeerPartner";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import PeerPartnerCard from "@/components/home/PeerPartnerCard";
import TierProgressMini from "@/components/home/TierProgressMini";
import DepartmentsCard from "@/components/home/DepartmentsCard";
import CollectiveChallengeCard from "@/components/home/CollectiveChallengeCard";
import FitnessHubCard from "@/components/home/FitnessHubCard";
import BrotherhoodCard from "@/components/home/BrotherhoodCard";
import BuyMerchandiseCard from "@/components/home/BuyMerchandiseCard";
import ArchivesCard from "@/components/home/ArchivesCard";
import { BentoGrid, BentoTile } from "@/components/home/BentoGrid";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

export default function Home() {
  const { data: appUser } = useCurrentUser();
  const { data: peer } = useCurrentPeerPartner();
  const qc = useQueryClient();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (appUser?.payment_status === "paid" && !appUser.onboarded_at) {
      setOnboardingOpen(true);
    }
  }, [appUser?.payment_status, appUser?.onboarded_at]);

  if (!appUser) return null;

  const handleComplete = async () => {
    const { error } = await supabase
      .from("users")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", appUser.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["currentUser"] });
    setOnboardingOpen(false);
    toast.success("Welcome aboard!");
  };

  const peerDestination =
    peer?.partners.length === 1 ? `/member/${peer.partners[0].id}` : "/me";
  const showTier = appUser.tiers?.name === "Foundation";

  return (
    <div className="px-5 py-5 max-w-md md:max-w-4xl mx-auto">
      <BentoGrid>
        <BentoTile colBase={2} colMd={4} to="/account" ariaLabel="Account settings">
          <WelcomeHeader user={appUser} />
        </BentoTile>

        <BentoTile
          colBase={2}
          colMd={2}
          rowMd={2}
          variant="hero"
          to="/fitness#challenge"
          ariaLabel="Open 100km challenge"
        >
          <CollectiveChallengeCard />
        </BentoTile>

        <BentoTile
          colBase={1}
          colMd={2}
          variant="hero"
          to={peerDestination}
          ariaLabel="Open peer profile"
          className="row-span-2 md:row-span-1"
        >
          <PeerPartnerCard />
        </BentoTile>

        <BentoTile
          colBase={1}
          colMd={2}
          variant="stat"
          to="/brotherhood"
          ariaLabel="Open brotherhood"
          className="p-3 pb-8 md:p-5"
        >
          <BrotherhoodCard />
        </BentoTile>

        <BentoTile
          colBase={1}
          colMd={2}
          variant="stat"
          to="/library/module/2-the-money-manual"
          ariaLabel="Open Money Manual"
          className="md:hidden p-3 md:p-5"
        >
          <BuyMerchandiseCard />
        </BentoTile>

        <BentoTile
          colBase={1}
          colMd={2}
          to="/communities"
          ariaLabel="Open communities"
        >
          <DepartmentsCard />
        </BentoTile>

        <BentoTile
          colBase={1}
          colMd={2}
          variant="stat"
          to="/fitness"
          ariaLabel="Open fitness"
        >
          <FitnessHubCard />
        </BentoTile>

        {showTier && (
          <BentoTile
            colBase={1}
            colMd={1}
            variant="stat"
            to="/me#tier"
            ariaLabel="Open tier progress"
          >
            <TierProgressMini />
          </BentoTile>
        )}

        <BentoTile
          colBase={2}
          colMd={4}
          ariaLabel="Archives"
        >
          <ArchivesCard />
        </BentoTile>
      </BentoGrid>

      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleComplete}
      />
    </div>
  );
}

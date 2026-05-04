import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import PeerPartnerCard from "@/components/home/PeerPartnerCard";
import TierProgressMini from "@/components/home/TierProgressMini";
import DepartmentsCard from "@/components/home/DepartmentsCard";
import CollectiveChallengeCard from "@/components/home/CollectiveChallengeCard";
import FitnessHubCard from "@/components/home/FitnessHubCard";
import BrotherhoodCard from "@/components/home/BrotherhoodCard";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

export default function Home() {
  const { data: appUser } = useCurrentUser();
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

  return (
    <div className="p-4 space-y-5 max-w-md mx-auto">
      <WelcomeHeader user={appUser} />
      <PeerPartnerCard />
      <DepartmentsCard />
      <BrotherhoodCard />
      <FitnessHubCard />
      <CollectiveChallengeCard />
      <TierProgressMini />
      <OnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={handleComplete}
      />
    </div>
  );
}

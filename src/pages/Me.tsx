import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import ProfileHeader from "@/components/me/ProfileHeader";
import TierProgressChecklist from "@/components/me/TierProgressChecklist";
import DepartmentSelector from "@/components/me/DepartmentSelector";
import AdminSection from "@/components/me/AdminSection";
import SignOutButton from "@/components/me/SignOutButton";
import FitnessLink from "@/components/me/FitnessLink";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Me() {
  const { data: appUser } = useCurrentUser();
  const navigate = useNavigate();
  if (!appUser) return null;

  const showProgress = appUser.tiers?.name === "Foundation";

  return (
    <div className="p-6 space-y-6">
      <FitnessLink />
      <button
        onClick={() => navigate("/account")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Settings className="h-4 w-4" /> Account settings
      </button>
      <ProfileHeader />
      {showProgress && <TierProgressChecklist />}
      <DepartmentSelector />
      <AdminSection />
      <SignOutButton />
    </div>
  );
}

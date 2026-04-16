import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import ProfileHeader from "@/components/me/ProfileHeader";
import TierProgressChecklist from "@/components/me/TierProgressChecklist";
import DepartmentSelector from "@/components/me/DepartmentSelector";
import AdminLink from "@/components/me/AdminLink";
import SignOutButton from "@/components/me/SignOutButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Me() {
  const { data: appUser } = useCurrentUser();
  const navigate = useNavigate();
  if (!appUser) return null;

  const showProgress = appUser.tiers?.name === "Foundation";

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate("/account")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Settings className="h-4 w-4" /> Account settings
      </button>
      <ProfileHeader />
      {showProgress && <TierProgressChecklist />}
      <DepartmentSelector />
      <AdminLink />
      <SignOutButton />
    </div>
  );
}

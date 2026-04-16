import ProfileHeader from "@/components/me/ProfileHeader";
import TierProgressChecklist from "@/components/me/TierProgressChecklist";
import DepartmentSelector from "@/components/me/DepartmentSelector";
import SignOutButton from "@/components/me/SignOutButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function Me() {
  const { data: appUser } = useCurrentUser();
  if (!appUser) return null;

  const showProgress = appUser.tiers?.name === "Foundation";

  return (
    <div className="p-6 space-y-6">
      <ProfileHeader />
      {showProgress && <TierProgressChecklist />}
      <DepartmentSelector />
      <SignOutButton />
    </div>
  );
}

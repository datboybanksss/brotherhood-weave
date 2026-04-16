import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AccountProfileHeader from "@/components/account/AccountProfileHeader";
import StatusTracker from "@/components/account/StatusTracker";
import MembershipInfo from "@/components/account/MembershipInfo";
import EditProfileForm from "@/components/account/EditProfileForm";
import DangerZone from "@/components/account/DangerZone";

export default function Account() {
  const navigate = useNavigate();
  const { data: appUser } = useCurrentUser();
  if (!appUser) return null;

  const showTracker = appUser.payment_status !== "paid";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <AccountProfileHeader user={appUser} />
        {showTracker && <StatusTracker user={appUser} />}
        <MembershipInfo user={appUser} />
        <EditProfileForm user={appUser} />
        <DangerZone />
      </div>
    </div>
  );
}

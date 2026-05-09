import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LifeBuoy, LockKeyhole, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import AccountProfileHeader from "@/components/account/AccountProfileHeader";
import StatusTracker from "@/components/account/StatusTracker";
import MembershipInfo from "@/components/account/MembershipInfo";
import EditProfileForm from "@/components/account/EditProfileForm";
import PhotoGalleryEditor from "@/components/account/PhotoGalleryEditor";
import StravaConnection from "@/components/account/StravaConnection";
import DangerZone from "@/components/account/DangerZone";
import DepartmentSelector from "@/components/me/DepartmentSelector";
import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { Button } from "@/components/ui/button";

export default function Account() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const { data: appUser } = useCurrentUser();
  const [rewatchOpen, setRewatchOpen] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === "#bio" && editFormRef.current) {
      editFormRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      const bioEl = editFormRef.current.querySelector<HTMLTextAreaElement>("#bio");
      bioEl?.focus();
    }
  }, [appUser]);

  useEffect(() => {
    const status = params.get("strava");
    if (!status) return;
    if (status === "connected") {
      const expected = sessionStorage.getItem("strava_oauth_nonce");
      const got = params.get("nonce");
      sessionStorage.removeItem("strava_oauth_nonce");
      if (expected && got && expected === got) {
        toast.success("Strava connected!");
        qc.invalidateQueries({ queryKey: ["stravaConnection"] });
      } else {
        toast.error("Strava connection rejected: state mismatch.");
      }
    } else if (status === "denied") {
      toast("Strava connection cancelled.");
    } else if (status === "error") {
      toast.error(`Strava connection failed: ${params.get("reason") ?? "unknown"}`);
    }
    navigate("/account", { replace: true });
  }, [params, navigate, qc]);

  if (!appUser) return null;

  const showTracker = appUser.payment_status !== "paid";
  const isPaid = appUser.payment_status === "paid";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <AccountProfileHeader user={appUser} />
        {showTracker && <StatusTracker user={appUser} />}
        <MembershipInfo user={appUser} />
        <div ref={editFormRef}>
          <EditProfileForm user={appUser} />
        </div>
        <PhotoGalleryEditor userId={appUser.id} />
        <DepartmentSelector />
        <StravaConnection />
        {isPaid && (
          <Button variant="outline" className="w-full justify-start" onClick={() => setRewatchOpen(true)}>
            <PlayCircle className="mr-2 h-4 w-4" /> Rewatch onboarding video
          </Button>
        )}
        <AccountHelpLinks />
        <DangerZone />
      </div>
      <OnboardingModal
        open={rewatchOpen}
        onClose={() => setRewatchOpen(false)}
        showCompleteButton={false}
      />
    </div>
  );
}

function AccountHelpLinks() {
  return (
    <section className="rounded-lg border border-brand-royal/20 bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">Account support</h2>
      <div className="mt-3 grid gap-2 text-sm">
        <Link to="/privacy-choices" className="inline-flex items-center gap-2 text-brand-royal underline">
          <LockKeyhole className="h-4 w-4" />
          Privacy choices
        </Link>
        <Link to="/account-deletion" className="inline-flex items-center gap-2 text-brand-royal underline">
          <Trash2 className="h-4 w-4" />
          Account deletion information
        </Link>
        <Link to="/support" className="inline-flex items-center gap-2 text-brand-royal underline">
          <LifeBuoy className="h-4 w-4" />
          Support and safety reports
        </Link>
      </div>
    </section>
  );
}

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getPublicMemberById, getMemberDepartments } from "@/api/members";
import PublicProfileHeader from "@/components/member/PublicProfileHeader";
import BioCard from "@/components/member/BioCard";
import LatestRunCard from "@/components/member/LatestRunCard";
import TierProgressChecklist from "@/components/me/TierProgressChecklist";
import AdminSection from "@/components/me/AdminSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EmojiIcon from "@/components/EmojiIcon";

export default function Me() {
  const { data: appUser } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#tier") {
      const el = document.getElementById("tier");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, appUser?.id]);

  const { data: member } = useQuery({
    queryKey: ["publicMember", appUser?.id],
    queryFn: () => getPublicMemberById(appUser!.id),
    enabled: !!appUser?.id,
  });

  const { data: depts } = useQuery({
    queryKey: ["memberDepts", appUser?.id],
    queryFn: () => getMemberDepartments(appUser!.id),
    enabled: !!appUser?.id,
  });

  if (!appUser || !member) return null;

  const primary = depts?.find((d) => d.is_primary)?.departments?.name ?? null;
  const showProgress = appUser.tiers?.name === "Foundation";

  const handleShare = async () => {
    const url = `${window.location.origin}/member/${appUser.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: appUser.full_name, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="p-6 pb-24 max-w-md mx-auto space-y-6 relative">
      <button
        onClick={() => navigate("/account")}
        aria-label="Account settings"
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <EmojiIcon cp="2699-fe0f" alt="Settings" size={20} />
      </button>

      <PublicProfileHeader member={member} primaryDept={primary} />

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 min-h-[44px]"
          onClick={() => navigate("/account#bio")}
        >
          <EmojiIcon cp="270f-fe0f" alt="Edit" size={16} className="mr-1" /> Edit profile
        </Button>
        <Button
          variant="outline"
          className="flex-1 min-h-[44px]"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <BioCard bio={member.bio} isOwnProfile />
      </div>

      {depts && depts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Departments</h2>
          <div className="flex flex-wrap gap-2">
            {depts.map((d) =>
              d.departments ? (
                <Badge key={d.departments.id} variant="secondary">
                  {d.departments.name}
                </Badge>
              ) : null
            )}
          </div>
        </div>
      )}

      <LatestRunCard userId={appUser.id} />

      {showProgress && (
        <div id="tier" className="pt-4 border-t border-border scroll-mt-20">
          <TierProgressChecklist />
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <AdminSection />
      </div>
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { getPublicMemberById, getMemberDepartments } from "@/api/members";
import { getOrCreateConversation } from "@/api/direct-messages";
import { useAuth } from "@/hooks/useAuth";
import PublicProfileHeader from "@/components/member/PublicProfileHeader";
import BioCard from "@/components/member/BioCard";
import LatestRunCard from "@/components/member/LatestRunCard";
import PhotoGallery from "@/components/member/PhotoGallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MemberProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: member, isLoading } = useQuery({
    queryKey: ["publicMember", id],
    queryFn: () => getPublicMemberById(id!),
    enabled: !!id,
  });

  const { data: depts } = useQuery({
    queryKey: ["memberDepts", id],
    queryFn: () => getMemberDepartments(id!),
    enabled: !!id,
  });

  if (isLoading) return null;
  if (!member) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-sm text-muted-foreground">Member not found.</p>
      </div>
    );
  }

  const primary = depts?.find((d) => d.is_primary)?.departments?.name ?? null;
  const isSelf = user?.id === member.id;

  const handleMessage = async () => {
    try {
      const convId = await getOrCreateConversation(member.id);
      navigate(`/messages/${convId}`);
    } catch {
      toast.error("Could not open conversation");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PublicProfileHeader member={member} primaryDept={primary} />
      {!isSelf && (
        <Button onClick={handleMessage} className="w-full gap-2" variant="outline">
          <MessageCircle className="h-4 w-4" />
          Message {member.full_name.split(" ")[0]}
        </Button>
      )}
      <PhotoGallery userId={member.id} />
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <BioCard bio={member.bio} />
      </div>
      {depts && depts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Departments</h2>
          <div className="flex flex-wrap gap-2">
            {depts.map((d) =>
              d.departments ? (
                <Badge key={d.departments.id} variant="secondary">{d.departments.name}</Badge>
              ) : null
            )}
          </div>
        </div>
      )}
      <LatestRunCard userId={member.id} />
    </div>
  );
}

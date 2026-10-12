import { useNavigate } from "react-router-dom";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import ApplicantCard from "@/components/admin/ApplicantCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Approvals() {
  const navigate = useNavigate();
  const { data: applicants, isLoading } = usePendingApprovals();
  const count = applicants?.length ?? 0;

  return (
    <div className="p-6 space-y-4 max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/me")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-foreground">Pending Approvals</h1>
        {count > 0 && <Badge variant="secondary">{count}</Badge>}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && count === 0 && (
        <p className="text-sm text-muted-foreground">No pending applicants right now.</p>
      )}

      <div className="space-y-3">
        {applicants?.map((a) => <ApplicantCard key={a.id} applicant={a} />)}
      </div>
    </div>
  );
}

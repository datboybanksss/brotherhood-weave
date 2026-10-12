import GuestApplications from "@/components/admin/GuestApplications";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import ApplicantCard from "@/components/admin/ApplicantCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Approvals() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: applicants, isLoading, isError, refetch } = usePendingApprovals();
  const count = applicants?.length ?? 0;

  return (
    <div className="p-6 space-y-4 max-w-md mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/me")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-foreground">Membership applications</h1>
        {count > 0 && <Badge variant="secondary">{count}</Badge>}
      </div>

      <GuestApplications />
      <h2 className="pt-6 font-semibold">Account approval requests</h2>
      <Input aria-label="Search applicants" placeholder="Search by name or email" value={search} onChange={e => setSearch(e.target.value)} />
      {isError && <div role="alert"><p>Could not load applicants.</p><Button variant="outline" onClick={() => refetch()}>Try again</Button></div>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && !isError && count === 0 && (
        <p className="text-sm text-muted-foreground">No pending applicants right now.</p>
      )}

      <div className="space-y-3">
        {applicants?.filter(a => `${a.full_name} ${a.email}`.toLowerCase().includes(search.toLowerCase())).map((a) => <ApplicantCard key={a.id} applicant={a} />)}
      </div>
    </div>
  );
}

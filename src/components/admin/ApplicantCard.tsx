import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { approveApplicant, rejectApplicant } from "@/api/admin";
import { useAuth } from "@/hooks/useAuth";
import type { PendingApplicant } from "@/hooks/usePendingApprovals";
import ApproveDialog from "./ApproveDialog";
import RejectDialog from "./RejectDialog";

export default function ApplicantCard({ applicant }: { applicant: PendingApplicant }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const canApprove = !!applicant.interview_booked_at;

  const approveMut = useMutation({
    mutationFn: () => approveApplicant(applicant.id),
    onSuccess: () => {
      console.log(`[ADMIN APPROVAL] ${user?.email} approved ${applicant.email} at ${new Date().toISOString()}`);
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success(`${applicant.full_name} approved. They can now complete payment.`);
      setApproveOpen(false);
    },
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectApplicant(applicant.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success(`${applicant.full_name} rejected.`);
      setRejectOpen(false);
    },
  });

  const avatarUrl = applicant.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(applicant.full_name)}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <img src={avatarUrl} alt={applicant.full_name} className="h-10 w-10 rounded-full bg-muted" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{applicant.full_name}</p>
        <p className="text-xs text-muted-foreground truncate">{applicant.email}</p>
        <p className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(applicant.created_at), { addSuffix: true })}</p>
        {canApprove ? (
          <p className="text-xs text-green-600">✓ Interview booked {format(new Date(applicant.interview_booked_at!), "MMM d")}</p>
        ) : (
          <p className="text-xs text-amber-500">● Interview not yet booked</p>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button size="sm" disabled={!canApprove} onClick={() => setApproveOpen(true)}>Approve</Button>
          </span>
        </TooltipTrigger>
        {!canApprove && <TooltipContent>Waiting for interview booking</TooltipContent>}
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="text-destructive" onClick={() => setRejectOpen(true)}>Reject</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ApproveDialog name={applicant.full_name} open={approveOpen} onOpenChange={setApproveOpen} onConfirm={() => approveMut.mutate()} loading={approveMut.isPending} />
      <RejectDialog name={applicant.full_name} open={rejectOpen} onOpenChange={setRejectOpen} onConfirm={() => rejectMut.mutate()} loading={rejectMut.isPending} />
    </div>
  );
}

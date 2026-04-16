import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import StatusStep from "./StatusStep";
import type { AppUser } from "@/hooks/useCurrentUser";

export default function StatusTracker({ user }: { user: AppUser }) {
  const navigate = useNavigate();

  const step1Subtitle = `Signed up ${formatDistanceToNow(new Date(user.created_at))} ago`;

  const step2Status = user.interview_booked_at ? "complete" as const : "action" as const;
  const step2Subtitle = user.interview_booked_at
    ? `Booked for ${format(new Date(user.interview_booked_at), "PPP")}`
    : "Book your interview to continue";
  const step2Action = !user.interview_booked_at ? (
    <Button size="sm" variant="outline" onClick={() => navigate("/interview")}>Book Interview</Button>
  ) : undefined;

  const step3Status = user.interview_completed ? "complete" as const : "action" as const;
  const step3Subtitle = user.interview_completed
    ? "Approved — complete your payment to join."
    : "We'll review after your interview. You'll hear back within 24 hours.";
  const step3Action = user.interview_completed ? (
    <Button size="sm" onClick={() => navigate("/payment")}>Complete Payment</Button>
  ) : undefined;

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">Application Status</h2>
      <StatusStep title="Account created" subtitle={step1Subtitle} status="complete" />
      <StatusStep title="Interview booked" subtitle={step2Subtitle} status={step2Status} action={step2Action} />
      <StatusStep title="Approval" subtitle={step3Subtitle} status={step3Status} action={step3Action} isLast />
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { useTierProgress } from "@/hooks/useTierProgress";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function TierProgressMini() {
  const navigate = useNavigate();
  const { data: appUser } = useCurrentUser();
  const { data: progress } = useTierProgress();

  if (appUser?.tiers?.name !== "Foundation" || !progress) return null;

  const steps = [
    progress.meetingsAttended >= 2,
    progress.moduleCompleted,
    progress.departmentCount >= 1,
    progress.daysMember >= 30,
  ];
  const done = steps.filter(Boolean).length;
  const pct = (done / 4) * 100;

  return (
    <button
      onClick={() => navigate("/me")}
      className="w-full text-left rounded-xl border border-border bg-card p-4 space-y-2 hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Your path to Independent Thinker</h3>
        <span className="text-xs text-muted-foreground">{done}/4</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}

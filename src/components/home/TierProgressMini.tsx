import { useTierProgress } from "@/hooks/useTierProgress";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmojiIcon from "@/components/EmojiIcon";

export default function TierProgressMini() {
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
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <EmojiIcon cp="1f4c8" alt="Chart increasing" size={14} /> Tier progress
      </div>
      <div>
        <div className="text-3xl font-bold leading-none text-foreground">{done}<span className="text-base text-muted-foreground">/4</span></div>
        <div className="text-xs text-muted-foreground mt-1">to Independent Thinker</div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

import { useTierProgress } from "@/hooks/useTierProgress";
import { Check, Circle } from "lucide-react";

export default function TierProgressChecklist() {
  const { data: progress } = useTierProgress();
  if (!progress) return null;

  const items = [
    {
      done: progress.meetingsAttended >= 2,
      label: `Attend 2 meetings (${progress.meetingsAttended}/2)`,
    },
    {
      done: progress.moduleCompleted,
      label: "Complete 1. Identity Alchemy",
    },
    {
      done: progress.departmentCount >= 1,
      label: "Join a department",
    },
    {
      done: progress.daysMember >= 30,
      label: `30 days of membership (${progress.daysMember}/30)`,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Ascend to Independent Thinker</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            {item.done ? (
              <Check className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

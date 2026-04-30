import { Card, CardContent } from "@/components/ui/card";

interface Props { totalReps: number; submissionCount: number; streak: number; rank: number; }

export default function FitnessStats({ totalReps, submissionCount, streak, rank }: Props) {
  const items: { label: string; value: string }[] = [
    { label: "This month", value: `${totalReps} reps` },
    { label: "Submissions", value: String(submissionCount) },
    { label: "Streak", value: streak === 1 ? "1 wk" : `${streak} wks` },
  ];
  if (rank > 0) items.push({ label: "Rank", value: `#${rank}` });
  return (
    <Card>
      <CardContent className="p-3 grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <div className="text-lg font-semibold tabular-nums">{it.value}</div>
            <div className="text-xs text-muted-foreground">{it.label}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

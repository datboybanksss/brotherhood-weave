import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ModuleCardProps {
  slug: string;
  title: string;
  description: string;
  locked: boolean;
  requiredTierName?: string;
  lessonsCompleted: number;
  totalLessons: number;
}

export default function ModuleCard({ slug, title, description, locked, requiredTierName, lessonsCompleted, totalLessons }: ModuleCardProps) {
  const navigate = useNavigate();
  const pct = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

  return (
    <button
      onClick={!locked ? () => navigate(`/library/module/${slug}`) : undefined}
      disabled={locked}
      className={`w-full text-left rounded-lg border border-border p-4 space-y-2 transition-colors ${locked ? "opacity-60 cursor-not-allowed" : "hover:bg-accent/50"}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {locked && requiredTierName && (
        <p className="text-xs text-muted-foreground italic">Unlock at {requiredTierName}</p>
      )}
      {!locked && (
        <div className="space-y-1">
          <Progress value={pct} className="h-2" />
          <p className="text-xs text-muted-foreground">{lessonsCompleted}/{totalLessons} lessons</p>
        </div>
      )}
    </button>
  );
}

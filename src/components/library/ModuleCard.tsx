import { Lock } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  locked: boolean;
}

export default function ModuleCard({ title, description, locked }: ModuleCardProps) {
  return (
    <div className={`rounded-lg border border-border p-4 space-y-2 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {locked && <p className="text-xs text-muted-foreground italic">Upgrade your tier to unlock</p>}
    </div>
  );
}

import { CircleCheck, Circle, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "complete" | "pending" | "action";

interface StatusStepProps {
  title: string;
  subtitle: string;
  status: Status;
  action?: React.ReactNode;
  isLast?: boolean;
}

const icons = {
  complete: <CircleCheck className="h-5 w-5 text-green-500 shrink-0" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground shrink-0" />,
  action: <CircleAlert className="h-5 w-5 text-amber-500 shrink-0" />,
};

export default function StatusStep({ title, subtitle, status, action, isLast }: StatusStepProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        {icons[status]}
        {!isLast && <div className={cn("w-px flex-1 min-h-[24px]", status === "complete" ? "bg-green-500" : "bg-border")} />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import Avatar from "@/components/Avatar";

interface MemberRowProps {
  userId: string;
  fullName: string;
  departmentName: string | null;
  title?: string | null;
}

export default function MemberRow({ userId, fullName, departmentName, title }: MemberRowProps) {
  return (
    <Link
      to={`/member/${userId}`}
      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 active:bg-accent transition-colors"
    >
      <Avatar userId={userId} size="md" />
      <div className="min-w-0">
        <p className="font-medium text-foreground truncate">{fullName}</p>
        {title && <p className="text-xs text-muted-foreground truncate">{title}</p>}
        {departmentName && (
          <p className="text-xs text-muted-foreground">{departmentName}</p>
        )}
      </div>
    </Link>
  );
}

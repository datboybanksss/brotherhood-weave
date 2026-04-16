import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AdminLink() {
  const { data: appUser } = useCurrentUser();
  if (!appUser?.is_admin) return null;

  return (
    <Link
      to="/admin/approvals"
      className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
    >
      <Shield className="h-4 w-4" />
      Admin: Approvals
    </Link>
  );
}

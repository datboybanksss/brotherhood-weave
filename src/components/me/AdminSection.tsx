import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ClipboardCheck, Archive, BookOpen, Layers, Users2, Mail } from "lucide-react";

const links = [
  { label: "Approvals", path: "/admin/approvals", icon: ClipboardCheck },
  { label: "Modules", path: "/admin/modules", icon: Layers },
  { label: "Archives", path: "/admin/archives", icon: Archive },
  { label: "Playbooks", path: "/admin/playbooks", icon: BookOpen },
  { label: "Pairings", path: "/admin/pairings", icon: Users2 },
  { label: "Invitations", path: "/admin/invitations", icon: Mail },
];

export default function AdminSection() {
  const { data: appUser } = useCurrentUser();
  const navigate = useNavigate();
  if (!appUser?.is_admin) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h3>
      {links.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}

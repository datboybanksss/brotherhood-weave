import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmojiIcon from "@/components/EmojiIcon";

const links = [
  { label: "Approvals",    path: "/admin/approvals",   cp: "1f4cb",      alt: "Clipboard" },
  { label: "Modules",      path: "/admin/modules",     cp: "1f4d1",      alt: "Bookmark tabs" },
  { label: "Archives",     path: "/admin/archives",    cp: "1f4e6",      alt: "Package" },
  { label: "Playbooks",    path: "/admin/playbooks",   cp: "1f4d6",      alt: "Open book" },
  { label: "Events",       path: "/admin/events",      cp: "1f4c5",      alt: "Calendar" },
  { label: "Pairings",     path: "/admin/pairings",    cp: "1f465",      alt: "People" },
  { label: "Invitations",  path: "/admin/invitations", cp: "1f4e7",      alt: "Email" },
];

export default function AdminSection() {
  const { data: appUser } = useCurrentUser();
  const navigate = useNavigate();
  if (!appUser?.is_admin) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</h3>
      {links.map(({ label, path, cp, alt }) => (
        <button
          key={path}
          onClick={() => navigate(path)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <EmojiIcon cp={cp} alt={alt} size={16} /> {label}
        </button>
      ))}
    </div>
  );
}

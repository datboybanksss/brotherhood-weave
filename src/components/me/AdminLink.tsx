import { Link } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import EmojiIcon from "@/components/EmojiIcon";

export default function AdminLink() {
  const { data: appUser } = useCurrentUser();
  if (!appUser?.is_admin) return null;

  return (
    <Link
      to="/admin/approvals"
      className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
    >
      <EmojiIcon cp="1f6e1-fe0f" alt="Shield" size={16} />
      Admin: Approvals
    </Link>
  );
}

import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export default function UserDropdownMenu() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar userId={user.id} size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("/account")}>
          <User className="mr-2 h-4 w-4" /> Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

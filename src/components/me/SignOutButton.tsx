import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SignOutButton() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    console.log("Signing out");
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <Button variant="outline" className="w-full min-h-[48px]" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}

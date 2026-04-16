import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DeleteAccountDialog from "./DeleteAccountDialog";

export default function DangerZone() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <div className="space-y-3">
      <Button variant="outline" className="w-full min-h-[48px]" onClick={handleSignOut}>
        Sign Out
      </Button>
      <DeleteAccountDialog />
    </div>
  );
}

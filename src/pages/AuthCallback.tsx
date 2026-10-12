import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Wait for session to be ready
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        toast.error("Sign-in did not complete");
        navigate("/login", { replace: true });
        return;
      }

      const pendingToken = sessionStorage.getItem("pending_invite_token");
      if (pendingToken) {
        sessionStorage.removeItem("pending_invite_token");
        try {
          const { data, error } = await supabase.functions.invoke("redeem_invitation", {
            body: { token: pendingToken },
          });
          if (error || (data && (data as { error?: string }).error)) {
            const code = (data as { error?: string })?.error ?? error?.message ?? "Failed";
            if (code === "email_mismatch") {
              await supabase.auth.signOut();
              toast.error("Email does not match invitation. Please sign in with the invited email.");
              navigate("/login", { replace: true });
              return;
            }
            toast.error(`Invite redemption failed: ${code}`);
          } else {
            toast.success("Welcome to the brotherhood!");
          }
        } catch (e) {
          toast.error("Invite redemption failed");
        }
      }

      // Decide destination based on app user state
      const { data: appUser } = await supabase
        .from("users")
        .select("payment_status, interview_completed")
        .eq("id", session.user.id)
        .maybeSingle();

      const redirectOverride = sessionStorage.getItem("post_oauth_redirect");
      sessionStorage.removeItem("post_oauth_redirect");

      if (appUser?.payment_status === "paid") {
        navigate(redirectOverride ?? "/home", { replace: true });
      } else {
        navigate("/interview", { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
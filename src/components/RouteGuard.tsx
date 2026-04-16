import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function RouteGuard() {
  const { user, loading: authLoading } = useAuth();
  const { data: appUser, isLoading: userLoading } = useCurrentUser();
  const location = useLocation();

  if (authLoading || (user && userLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    const publicPaths = ["/login", "/signup"];
    if (publicPaths.includes(location.pathname)) return <Outlet />;
    return <Navigate to="/login" replace />;
  }

  // Authenticated but no appUser yet
  if (!appUser) return null;

  // Rejected user — force sign out
  if (appUser.rejected_at) {
    supabase.auth.signOut();
    toast.error("Your application was not approved at this time.");
    return <Navigate to="/login" replace />;
  }

  const isPaid = appUser.payment_status === "paid";
  const interviewDone = appUser.interview_completed;

  // Admin routes
  if (location.pathname.startsWith("/admin")) {
    if (!appUser.is_admin) {
      toast.error("Access denied.");
      return <Navigate to="/home" replace />;
    }
    return <Outlet />;
  }

  // State 1: pre-payment
  if (!isPaid) {
    if (interviewDone && location.pathname === "/payment") return <Outlet />;
    if (location.pathname === "/interview") return <Outlet />;
    if (interviewDone) return <Navigate to="/payment" replace />;
    return <Navigate to="/interview" replace />;
  }

  // State 2 & 3: paid members
  const publicPaths = ["/login", "/signup", "/interview", "/payment"];
  if (publicPaths.includes(location.pathname)) return <Navigate to="/home" replace />;

  return <Outlet />;
}

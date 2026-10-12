import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PUBLIC_PATHS = ["/login", "/signup"];
const ALWAYS_ALLOWED_AUTHENTICATED = ["/account"];

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

  if (!user) {
    if (PUBLIC_PATHS.includes(location.pathname)) return <Outlet />;
    return <Navigate to="/login" replace />;
  }

  if (!appUser) return null;

  if (appUser.rejected_at) {
    supabase.auth.signOut();
    toast.error("Your application was not approved at this time.");
    return <Navigate to="/login" replace />;
  }

  // Always-allowed routes for any authenticated user
  if (ALWAYS_ALLOWED_AUTHENTICATED.includes(location.pathname)) return <Outlet />;

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
  if (PUBLIC_PATHS.includes(location.pathname) || ["/interview", "/payment"].includes(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

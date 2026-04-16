import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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

  const isPaid = appUser.payment_status === "paid";
  const interviewDone = appUser.interview_completed;

  // State 1: pre-payment
  if (!isPaid) {
    // Can go to payment if interview completed
    if (interviewDone && location.pathname === "/payment") return <Outlet />;
    // Otherwise must be on interview
    if (location.pathname === "/interview") return <Outlet />;
    // Redirect to payment if interview done, otherwise interview
    if (interviewDone) return <Navigate to="/payment" replace />;
    return <Navigate to="/interview" replace />;
  }

  // State 2 & 3: paid members
  const publicPaths = ["/login", "/signup", "/interview", "/payment"];
  if (publicPaths.includes(location.pathname)) return <Navigate to="/home" replace />;

  return <Outlet />;
}

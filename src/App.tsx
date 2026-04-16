import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import RouteGuard from "@/components/RouteGuard";
import PaidLayout from "@/components/PaidLayout";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Interview from "@/pages/Interview";
import Payment from "@/pages/Payment";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import Brotherhood from "@/pages/Brotherhood";
import Me from "@/pages/Me";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<RouteGuard />}>
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/payment" element={<Payment />} />
              <Route element={<PaidLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/brotherhood" element={<Brotherhood />} />
                <Route path="/me" element={<Me />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

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
import Account from "@/pages/Account";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import ModuleDetail from "@/pages/ModuleDetail";
import LessonReader from "@/pages/LessonReader";
import ArchiveDetail from "@/pages/ArchiveDetail";
import PlaybookDetail from "@/pages/PlaybookDetail";
import Brotherhood from "@/pages/Brotherhood";
import Me from "@/pages/Me";
import Approvals from "@/pages/admin/Approvals";
import AdminArchivesList from "@/pages/admin/ArchivesList";
import ArchiveForm from "@/pages/admin/ArchiveForm";
import AdminPlaybooksList from "@/pages/admin/PlaybooksList";
import PlaybookForm from "@/pages/admin/PlaybookForm";
import AdminModulesList from "@/pages/admin/ModulesList";
import ModuleForm from "@/pages/admin/ModuleForm";
import LessonForm from "@/pages/admin/LessonForm";
import AdminPairings from "@/pages/admin/Pairings";
import InvitationsAdmin from "@/pages/admin/InvitationsAdmin";
import MemberProfile from "@/pages/MemberProfile";
import Fitness from "@/pages/Fitness";
import Communities from "@/pages/Communities";
import ChannelView from "@/pages/ChannelView";
import EventDetail from "@/pages/EventDetail";
import ConversationView from "@/pages/ConversationView";
import AdminEvents from "@/pages/admin/Events";
import EventForm from "@/components/admin/EventForm";
import AuthCallback from "@/pages/AuthCallback";
import InviteRedemption from "@/pages/InviteRedemption";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/invite/:token" element={<InviteRedemption />} />
            <Route element={<RouteGuard />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/interview" element={<Interview />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/account" element={<Account />} />
              <Route path="/admin/approvals" element={<Approvals />} />
              <Route path="/admin/archives" element={<AdminArchivesList />} />
              <Route path="/admin/archives/new" element={<ArchiveForm />} />
              <Route path="/admin/archives/:id/edit" element={<ArchiveForm />} />
              <Route path="/admin/playbooks" element={<AdminPlaybooksList />} />
              <Route path="/admin/playbooks/new" element={<PlaybookForm />} />
              <Route path="/admin/playbooks/:id/edit" element={<PlaybookForm />} />
              <Route path="/admin/modules" element={<AdminModulesList />} />
              <Route path="/admin/modules/new" element={<ModuleForm />} />
              <Route path="/admin/modules/:id/edit" element={<ModuleForm />} />
              <Route path="/admin/modules/:moduleId/lessons/new" element={<LessonForm />} />
              <Route path="/admin/modules/:moduleId/lessons/:lessonId/edit" element={<LessonForm />} />
              <Route path="/admin/pairings" element={<AdminPairings />} />
              <Route path="/admin/invitations" element={<InvitationsAdmin />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/events/new" element={<EventForm />} />
              <Route path="/admin/events/:id/edit" element={<EventForm />} />
              <Route element={<PaidLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/library/module/:slug" element={<ModuleDetail />} />
                <Route path="/library/module/:moduleSlug/lesson/:lessonIndex" element={<LessonReader />} />
                <Route path="/library/archive/:id" element={<ArchiveDetail />} />
                <Route path="/library/playbook/:slug" element={<PlaybookDetail />} />
                <Route path="/brotherhood" element={<Brotherhood />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/communities/:slug" element={<ChannelView />} />
                <Route path="/me" element={<Me />} />
                <Route path="/member/:id" element={<MemberProfile />} />
                <Route path="/fitness" element={<Fitness />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/messages/:id" element={<ConversationView />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

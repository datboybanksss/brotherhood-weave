import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import UserDropdownMenu from "@/components/UserDropdownMenu";

const CALENDLY_URL = "https://calendly.com/kgosinoko11/interview";

export default function Interview() {
  const { user } = useAuth();
  const { data: appUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const bookMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("users")
        .update({ interview_booked_at: new Date().toISOString() })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onError: () => toast.error("We couldn’t save your booking confirmation. Please try again."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Booking acknowledgement saved.");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <UserDropdownMenu />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <Link to="/apply" className="text-sm text-brand-royal underline">View my application status</Link>
        <h1 className="text-2xl font-bold text-foreground text-center">Book Your Interview</h1>

        <p className="text-sm text-muted-foreground">Choose a time below. Only confirm once you have completed the booking.</p>
        <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="block text-sm text-brand-royal underline">Calendar not loading? Open booking in a new tab</a>
        <div className="rounded-lg border border-border overflow-hidden">
          <iframe
            src={CALENDLY_URL}
            className="w-full border-0"
            style={{ height: 400 }}
            title="Book Interview"
          />
        </div>

        {!appUser?.interview_booked_at ? (
          <Button
            onClick={() => bookMutation.mutate()}
            className="w-full min-h-[48px]"
            disabled={bookMutation.isPending}
          >
            I've Booked My Interview
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              Interview booked. We'll review your application after our call and get back to you when a decision is ready. Check your application page for updates.
            </div>
            <Button variant="outline" className="w-full min-h-[48px]" onClick={() => navigate("/account")}>
              View my status
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

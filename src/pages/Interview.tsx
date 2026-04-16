import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Interview booking confirmed!");
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <UserDropdownMenu />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">Book Your Interview</h1>

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
              Interview booked. We'll review your application after our call and get back to you within 24 hours. You can check your status anytime on your Account page.
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

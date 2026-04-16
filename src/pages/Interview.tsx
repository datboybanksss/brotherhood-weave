import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/kgosinoko11/interview";

export default function Interview() {
  const { user } = useAuth();
  const { data: appUser } = useCurrentUser();
  const queryClient = useQueryClient();

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
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
          <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            Interview booked. After our call, your application will be reviewed. If approved, you'll get access to complete your payment and join the brotherhood. Expect to hear back within 24 hours of the interview.
          </div>
        )}

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

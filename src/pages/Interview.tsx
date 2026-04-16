import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL || "https://calendly.com/familyties/interview";

export default function Interview() {
  const { user } = useAuth();
  const { data: appUser } = useCurrentUser();
  const queryClient = useQueryClient();

  const bookMutation = useMutation({
    mutationFn: async () => {
      console.log("Marking interview booked");
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

  const completeMutation = useMutation({
    mutationFn: async () => {
      console.log("Admin marking interview complete");
      const { error } = await supabase
        .from("users")
        .update({ interview_completed: true })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Interview marked complete. Proceed to payment.");
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
            ✓ Interview booked. You'll get full access after your interview and payment.
          </div>
        )}

        {appUser?.is_admin && !appUser.interview_completed && (
          <Button
            variant="outline"
            onClick={() => completeMutation.mutate()}
            className="w-full min-h-[48px]"
            disabled={completeMutation.isPending}
          >
            [Admin] Mark Interview Complete
          </Button>
        )}

        {appUser?.interview_completed && (
          <div className="rounded-lg bg-muted p-4 text-center text-sm">
            ✓ Interview complete!{" "}
            <a href="/payment" className="text-primary underline">Proceed to payment →</a>
          </div>
        )}
      </div>
    </div>
  );
}

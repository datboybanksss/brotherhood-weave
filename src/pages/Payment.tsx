import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const payMutation = useMutation({
    mutationFn: async () => {
      console.log("Processing stub payment for:", user!.id);
      const { error } = await supabase.rpc("process_payment", {
        p_user_id: user!.id,
        p_amount: 250,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Welcome to Family Ties! 🎉");
      navigate("/home");
    },
    onError: (err: Error) => {
      toast.error("Payment failed: " + err.message);
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">Complete Your Membership</h1>
        <div className="rounded-lg border border-border p-6 text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">R250/month</p>
          <p className="text-sm text-muted-foreground">
            Your membership unlocks all Foundation-level content, the brotherhood directory, meetings, and more.
          </p>
          <Button
            onClick={() => payMutation.mutate()}
            className="w-full min-h-[48px]"
            disabled={payMutation.isPending}
          >
            {payMutation.isPending ? "Processing..." : "Simulate Payment Success"}
          </Button>
        </div>
      </div>
    </div>
  );
}

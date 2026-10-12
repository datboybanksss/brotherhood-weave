import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthDivider from "@/components/auth/AuthDivider";

type ValidateResult =
  | { status: "valid"; invitation: { email: string; full_name: string; intended_tier: string; expires_at: string } }
  | { status: "used" | "expired" | "revoked" | "invalid"; reason?: string };

const schema = z.object({
  password: z.string().min(6, "Minimum 6 characters").max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

type FormData = z.infer<typeof schema>;

export default function InviteRedemption() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<ValidateResult | { status: "loading" }>({ status: "loading" });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!token) { setState({ status: "invalid" }); return; }
    (async () => {
      const { data, error } = await supabase.functions.invoke("validate_invitation", { body: { token } });
      if (error) { setState({ status: "invalid" }); return; }
      setState(data as ValidateResult);
    })();
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (state.status !== "valid" || !token) return;
    const { data: result, error } = await supabase.functions.invoke("redeem_invitation", {
      body: { token, password: data.password },
    });
    const errCode = (result as { error?: string })?.error ?? error?.message;
    if (errCode) {
      toast.error(`Could not redeem invite: ${errCode}`);
      return;
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: state.invitation.email,
      password: data.password,
    });
    if (signInErr) {
      toast.error(signInErr.message);
      return;
    }
    toast.success("Welcome to the brotherhood!");
    navigate("/home", { replace: true });
  };

  const handleGoogleClick = () => {
    if (token) sessionStorage.setItem("pending_invite_token", token);
  };

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking invitation...</p>
      </div>
    );
  }

  if (state.status !== "valid") {
    const messages: Record<string, { title: string; body: string }> = {
      used: { title: "Invitation already used", body: "This invitation link has already been redeemed." },
      expired: { title: "Invitation expired", body: "This invitation has expired. Please request a new one." },
      revoked: { title: "Invitation revoked", body: "This invitation is no longer valid." },
      invalid: { title: "Invalid invitation", body: "We couldn't find this invitation." },
    };
    const m = messages[state.status] ?? messages.invalid;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">{m.title}</h1>
          <p className="text-sm text-muted-foreground">{m.body}</p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>Go to log in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">You're invited</h1>
          <p className="text-sm text-muted-foreground">Welcome, {state.invitation.full_name}. Set a password to claim your spot.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={state.invitation.email} disabled className="text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} className="text-base" />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...register("confirm")} className="text-base" />
            {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
          </div>
          <Button type="submit" className="w-full min-h-[48px]" disabled={isSubmitting}>
            {isSubmitting ? "Joining..." : "Join the brotherhood"}
          </Button>
        </form>
        <AuthDivider />
        <div onClickCapture={handleGoogleClick}>
          <GoogleSignInButton label="Continue with Google" />
        </div>
      </div>
    </div>
  );
}
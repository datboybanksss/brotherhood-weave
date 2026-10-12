import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthDivider from "@/components/auth/AuthDivider";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    console.log("Logging in:", data.email);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">Family Ties</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} className="text-base" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} className="text-base" />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full min-h-[48px]" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Log In"}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground">
          New here? <Link to="/signup" className="text-primary underline">Sign up</Link>
        </p>
        <AuthDivider />
        <GoogleSignInButton />
        <p className="text-center text-xs leading-5 text-muted-foreground">
          By continuing, you agree to the{" "}
          <Link to="/terms" className="font-medium text-brand-royal underline">
            Terms
          </Link>{" "}
          and acknowledge the{" "}
          <Link to="/privacy" className="font-medium text-brand-royal underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/support" className="font-medium text-brand-royal underline">
            Support
          </Link>
          <Link to="/account-deletion" className="font-medium text-brand-royal underline">
            Delete account
          </Link>
        </div>
      </div>
    </div>
  );
}

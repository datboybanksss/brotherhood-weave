import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthDivider from "@/components/auth/AuthDivider";

const schema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  terms_accepted: z.boolean().refine((value) => value, "Please agree to the Terms and Privacy Policy"),
});

type FormData = z.infer<typeof schema>;

export default function Signup() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { terms_accepted: false },
  });
  const termsAccepted = watch("terms_accepted");

  const onSubmit = async (data: FormData) => {
    console.log("Signing up:", data.email);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
    navigate("/interview");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-foreground text-center">Join Family Ties</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" {...register("full_name")} className="text-base" />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>
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
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-lg border border-brand-royal/20 bg-brand-royal-tint/30 p-3">
              <Checkbox
                id="terms_accepted"
                checked={termsAccepted}
                onCheckedChange={(checked) =>
                  setValue("terms_accepted", checked === true, { shouldDirty: true, shouldValidate: true })
                }
                className="mt-1 border-brand-royal data-[state=checked]:bg-brand-royal data-[state=checked]:text-white"
              />
              <div className="text-sm leading-6 text-muted-foreground">
                I agree to the{" "}
                <PolicyPreview type="terms" />
                {" "}and acknowledge the{" "}
                <PolicyPreview type="privacy" />
                .
              </div>
            </div>
            {errors.terms_accepted && <p className="text-sm text-destructive">{errors.terms_accepted.message}</p>}
          </div>
          <Button type="submit" className="w-full min-h-[48px]" disabled={isSubmitting || !termsAccepted}>
            {isSubmitting ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-sm text-center text-muted-foreground">
          Already a member? <Link to="/login" className="text-primary underline">Log in</Link>
        </p>
        <AuthDivider />
        <GoogleSignInButton disabled={!termsAccepted} />
        {!termsAccepted && (
          <p className="text-center text-xs leading-5 text-muted-foreground">
            Agree to the Terms and Privacy Policy to continue with Google.
          </p>
        )}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/support" className="font-medium text-brand-royal underline">
            Support
          </Link>
          <Link to="/privacy-choices" className="font-medium text-brand-royal underline">
            Privacy choices
          </Link>
        </div>
      </div>
    </div>
  );
}

function PolicyPreview({ type }: { type: "terms" | "privacy" }) {
  const isTerms = type === "terms";
  const href = isTerms ? "/terms" : "/privacy";
  const title = isTerms ? "Terms of Service" : "Privacy Policy";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="font-medium text-brand-royal underline underline-offset-2 hover:opacity-80"
        >
          {isTerms ? "Terms" : "Privacy Policy"}
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[82vh] max-w-md overflow-y-auto rounded-lg border-brand-royal/25">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            A quick readable summary. The full policy remains available on its own page.
          </DialogDescription>
        </DialogHeader>
        {isTerms ? (
          <div className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              Family Ties is a private member platform. Members must use accurate account information, respect
              other members, and avoid harassment, impersonation, scraping, unlawful content, or misuse of the
              community.
            </p>
            <p>
              Fitness tools are for accountability and are not medical advice. Social profiles must belong to
              the member connecting them.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm leading-7 text-muted-foreground">
            <p>
              Family Ties uses account, profile, community, fitness, event, learning, and contact information to
              operate the member experience.
            </p>
            <p>
              Email contact only appears when enabled. Social icons stay hidden until verified through the
              relevant platform connection. Privacy requests go to support@familyties.info.
            </p>
          </div>
        )}
        <Link to={href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-royal underline">
          Open full {title}
        </Link>
      </DialogContent>
    </Dialog>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/api/account";
import type { AppUser } from "@/hooks/useCurrentUser";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  avatar_url: z.string().url("Must be a valid URL").or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function EditProfileForm({ user }: { user: AppUser }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: user.full_name, avatar_url: user.avatar_url || "" },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => updateProfile(user.id, { full_name: data.full_name, avatar_url: data.avatar_url || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="rounded-lg border border-border p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Edit Profile</h2>
      <div className="space-y-1">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input id="avatar_url" placeholder="https://..." {...register("avatar_url")} />
        <p className="text-xs text-muted-foreground">File upload coming soon — paste an image URL for now.</p>
        {errors.avatar_url && <p className="text-xs text-destructive">{errors.avatar_url.message}</p>}
      </div>
      <Button type="submit" className="w-full min-h-[48px]" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

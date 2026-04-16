import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ImagePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateProfile, uploadAvatar } from "@/api/account";
import type { AppUser } from "@/hooks/useCurrentUser";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
});

type FormData = z.infer<typeof schema>;

export default function EditProfileForm({ user }: { user: AppUser }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: user.full_name },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const url = await uploadAvatar(user.id, file);
      await updateProfile(user.id, { full_name: user.full_name, avatar_url: url });
      return url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["avatarUser", user.id] });
      toast.success("Avatar updated");
      setUploading(false);
    },
    onError: (err: Error) => { toast.error(err.message); setUploading(false); },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => updateProfile(user.id, { full_name: data.full_name, avatar_url: user.avatar_url }),
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
        <Label>Profile photo</Label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) avatarMutation.mutate(file);
        }} />
        <Button type="button" variant="outline" className="w-full min-h-[48px] gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload new photo"}
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>

      <Button type="submit" className="w-full min-h-[48px]" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Globe, ImagePlus, Instagram, Linkedin, Music2, Trash2, Twitter, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { deleteAvatar, updateProfile, uploadAvatar } from "@/api/account";
import type { AppUser } from "@/hooks/useCurrentUser";
import { getMemberSocialLinks, replaceMySocialLinks } from "@/api/social-links";
import { normalizeSocialUrl, SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social-links";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(280, "Bio must be 280 characters or less").optional(),
  title: z.string().max(80, "Title must be 80 characters or less").optional(),
  current_city: z.string().max(50, "City must be 50 characters or less").optional(),
  email_visible: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;
type SocialDraft = Partial<Record<SocialPlatform, string>>;

const socialIcons = {
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  x: Twitter,
  youtube: Youtube,
  website: Globe,
} satisfies Record<SocialPlatform, typeof Instagram>;

export default function EditProfileForm({ user }: { user: AppUser }) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [socialDraft, setSocialDraft] = useState<SocialDraft>({});

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user.full_name,
      bio: user.bio ?? "",
      title: user.title ?? "",
      current_city: user.current_city ?? "",
      email_visible: user.email_visible ?? false,
    },
  });
  const bioValue = watch("bio") ?? "";
  const titleValue = watch("title") ?? "";
  const emailVisible = watch("email_visible") ?? false;

  const { data: socialLinks } = useQuery({
    queryKey: ["memberSocialLinks", user.id],
    queryFn: () => getMemberSocialLinks(user.id),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!socialLinks) return;
    setSocialDraft(Object.fromEntries(socialLinks.map((link) => [link.platform, link.url])) as SocialDraft);
  }, [socialLinks]);

  const toggleSocialPlatform = (platform: SocialPlatform) => {
    setSocialDraft((current) => {
      const next = { ...current };
      if (platform in next) delete next[platform];
      else next[platform] = "";
      return next;
    });
  };

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

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      await deleteAvatar(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["avatarUser", user.id] });
      toast.success("Profile photo removed");
      setUploading(false);
    },
    onError: (err: Error) => { toast.error(err.message); setUploading(false); },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const selectedLinks = Object.entries(socialDraft).map(([platform, value]) => {
        const normalized = normalizeSocialUrl(platform as SocialPlatform, value);
        if ((value ?? "").trim() && !normalized) {
          const label = SOCIAL_PLATFORMS.find((option) => option.platform === platform)?.label ?? "Social";
          throw new Error(`Enter a valid ${label} handle or URL`);
        }
        return normalized ? { platform: platform as SocialPlatform, url: normalized } : null;
      }).filter((link): link is { platform: SocialPlatform; url: string } => link !== null);

      return Promise.all([
        updateProfile(user.id, {
        full_name: data.full_name,
        avatar_url: user.avatar_url,
        bio: data.bio ?? null,
        title: data.title ?? null,
        current_city: data.current_city ?? null,
        email_visible: data.email_visible ?? false,
        }),
        replaceMySocialLinks(user.id, selectedLinks.map((link) => ({
          ...link,
          display_order: SOCIAL_PLATFORMS.findIndex((option) => option.platform === link.platform),
        }))),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["publicMember", user.id] });
      queryClient.invalidateQueries({ queryKey: ["memberSocialLinks", user.id] });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="rounded-lg border border-border p-4 space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Edit Profile</h2>

      <div className="space-y-1">
        <Label>Profile photo</Label>
        <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) avatarMutation.mutate(file);
        }} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) avatarMutation.mutate(file);
        }} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1 min-h-[48px] gap-2" disabled={uploading} onClick={() => cameraRef.current?.click()}>
            <Camera className="h-4 w-4" />
            Take a selfie
          </Button>
          <Button type="button" variant="outline" className="flex-1 min-h-[48px] gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
            Gallery
          </Button>
        </div>
        {user.avatar_url && (
          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[44px] gap-2 text-destructive hover:text-destructive"
            disabled={uploading}
            onClick={() => {
              if (confirm("Remove your profile photo?")) deleteAvatarMutation.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Remove photo
          </Button>
        )}
        {uploading && <p className="text-xs text-muted-foreground text-center">Uploading…</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">What you do</Label>
        <Input id="title" maxLength={80} placeholder="Final year medical student at Wits" {...register("title")} />
        <div className="flex justify-between">
          <p className="text-xs text-muted-foreground">Visible to other members.</p>
          {titleValue.length > 60 && (
            <p className="text-xs text-muted-foreground">{titleValue.length}/80</p>
          )}
        </div>
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="current_city">Current city</Label>
        <Input id="current_city" maxLength={50} placeholder="Johannesburg" {...register("current_city")} />
        <p className="text-xs text-muted-foreground">Optional. Helps brothers in your city find you.</p>
        {errors.current_city && <p className="text-xs text-destructive">{errors.current_city.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          maxLength={280}
          placeholder="A line or two about you — what you're working on, what you care about, where you're from."
          {...register("bio")}
        />
        <div className="flex justify-between">
          <p className="text-xs text-muted-foreground">Visible to other members on your profile.</p>
          <p className="text-xs text-muted-foreground">{bioValue.length}/280</p>
        </div>
        {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
      </div>

      <div className="flex items-start justify-between gap-3 rounded-md border border-brand-royal/20 p-3">
        <div className="space-y-0.5">
          <Label htmlFor="email_visible" className="cursor-pointer">Email contact</Label>
          <p className="text-xs text-muted-foreground">Shows a mail icon on your member profile. Off by default.</p>
        </div>
        <Switch
          id="email_visible"
          checked={emailVisible}
          onCheckedChange={(v) => setValue("email_visible", v, { shouldDirty: true })}
        />
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Social profiles</h3>
          <p className="text-xs text-muted-foreground">Select the platforms you want visible, then add a handle or URL.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SOCIAL_PLATFORMS.map((option) => {
            const Icon = socialIcons[option.platform];
            const selected = option.platform in socialDraft;
            return (
              <button
                key={option.platform}
                type="button"
                onClick={() => toggleSocialPlatform(option.platform)}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors ${
                  selected
                    ? "border-brand-royal bg-brand-royal-tint text-brand-royal"
                    : "border-brand-royal/20 bg-surface-white text-text-muted"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {SOCIAL_PLATFORMS.filter((option) => option.platform in socialDraft).map((option) => (
            <div key={option.platform} className="space-y-1">
              <Label htmlFor={`social_${option.platform}`}>{option.label}</Label>
              <Input
                id={`social_${option.platform}`}
                value={socialDraft[option.platform] ?? ""}
                maxLength={300}
                placeholder={option.placeholder}
                onChange={(event) => setSocialDraft((current) => ({
                  ...current,
                  [option.platform]: event.target.value,
                }))}
              />
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full min-h-[48px]" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}

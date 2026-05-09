import { supabase } from "@/lib/supabase";
import type { SocialPlatform } from "@/lib/social-links";

export interface MemberSocialLink {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  url: string;
  display_order: number;
  verification_status: "unverified" | "pending" | "verified" | "failed";
  verified_at: string | null;
  verification_method: string | null;
  platform_user_id: string | null;
  platform_username: string | null;
}

export interface SocialLinkInput {
  platform: SocialPlatform;
  url: string;
  display_order: number;
}

export async function getMemberSocialLinks(userId: string): Promise<MemberSocialLink[]> {
  const { data, error } = await supabase
    .from("member_social_links")
    .select("id, user_id, platform, url, display_order, verification_status, verified_at, verification_method, platform_user_id, platform_username")
    .eq("user_id", userId)
    .order("display_order", { ascending: true })
    .order("platform", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MemberSocialLink[];
}

export async function replaceMySocialLinks(userId: string, links: SocialLinkInput[]) {
  const { error: deleteError } = await supabase
    .from("member_social_links")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (links.length === 0) return;

  const { error } = await supabase.from("member_social_links").insert(
    links.map((link) => ({
      user_id: userId,
      platform: link.platform,
      url: link.url,
      display_order: link.display_order,
    })),
  );
  if (error) throw error;
}

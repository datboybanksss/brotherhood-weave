import { useQuery } from "@tanstack/react-query";
import { Globe, Instagram, Linkedin, Mail, Music2, Twitter, Youtube } from "lucide-react";
import { getMemberContact } from "@/api/contact";
import { getMemberSocialLinks } from "@/api/social-links";
import type { PublicMember } from "@/api/members";
import type { SocialPlatform } from "@/lib/social-links";

interface Props {
  member: PublicMember;
}

type ContactAction = {
  href: string;
  label: string;
  icon: typeof Mail;
};

const socialIcons = {
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  x: Twitter,
  youtube: Youtube,
  website: Globe,
} satisfies Record<SocialPlatform, typeof Mail>;

const socialLabels = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  website: "Website",
} satisfies Record<SocialPlatform, string>;

export default function MemberContactActions({ member }: Props) {
  const { data: contact } = useQuery({
    queryKey: ["memberContact", member.id],
    queryFn: () => getMemberContact(member.id),
    enabled: member.email_visible === true,
    staleTime: 5 * 60_000,
  });

  const { data: socialLinks } = useQuery({
    queryKey: ["memberSocialLinks", member.id],
    queryFn: () => getMemberSocialLinks(member.id),
    staleTime: 5 * 60_000,
  });

  const actions: ContactAction[] = [
    contact?.email ? {
      href: `mailto:${contact.email}`,
      label: "Email",
      icon: Mail,
    } : null,
    ...(socialLinks ?? []).map((link) => ({
      href: link.url,
      label: socialLabels[link.platform],
      icon: socialIcons[link.platform],
    })),
  ].filter((action): action is ContactAction => action !== null);

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const isMail = action.href.startsWith("mailto:");
        return (
          <a
            key={action.label}
            href={action.href}
            target={isMail ? undefined : "_blank"}
            rel={isMail ? undefined : "noreferrer"}
            aria-label={action.label}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-royal/20 bg-surface-white text-brand-royal transition-colors hover:bg-brand-royal-tint"
          >
            <Icon className="h-4 w-4" strokeWidth={1.5} />
          </a>
        );
      })}
    </div>
  );
}

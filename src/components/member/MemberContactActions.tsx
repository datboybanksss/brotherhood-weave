import { useQuery } from "@tanstack/react-query";
import { Globe, Instagram, Linkedin, Mail, Music2, Twitter, Youtube } from "lucide-react";

function GmailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 12.713 1.5 5.25v12A1.75 1.75 0 0 0 3.25 19h3.5V11.5L12 15.25l5.25-3.75V19h3.5A1.75 1.75 0 0 0 22.5 17.25v-12L12 12.713Z" />
      <path d="M22.5 5.25A1.75 1.75 0 0 0 20.75 3.5h-.5L12 9.5 3.75 3.5h-.5A1.75 1.75 0 0 0 1.5 5.25l10.5 7.463L22.5 5.25Z" opacity=".85" />
    </svg>
  );
}
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
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ["memberContact", member.id],
    queryFn: () => getMemberContact(member.id),
    enabled: member.email_visible === true,
    staleTime: 5 * 60_000,
  });

  const { data: socialLinks, isLoading: socialLinksLoading } = useQuery({
    queryKey: ["memberSocialLinks", member.id],
    queryFn: () => getMemberSocialLinks(member.id),
    staleTime: 5 * 60_000,
  });

  const loading = socialLinksLoading || (member.email_visible === true && contactLoading);

  if (loading) {
    return (
      <div className="flex min-h-10 items-center justify-center gap-2" aria-hidden>
        {Array.from({ length: member.email_visible ? 3 : 2 }).map((_, index) => (
          <span
            key={index}
            className="h-10 w-10 rounded-full border border-brand-royal/10 bg-brand-royal-tint/50"
          />
        ))}
      </div>
    );
  }

  const actions: ContactAction[] = [
    contact?.email ? {
      href: `mailto:${contact.email}`,
      label: "Email",
      icon: GmailIcon,
    } : null,
    ...(socialLinks ?? []).filter((link) => link.verification_status === "verified" && !!link.verified_at).map((link) => ({
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

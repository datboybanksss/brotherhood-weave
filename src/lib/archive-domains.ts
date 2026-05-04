export type ArchiveDomain =
  | "purpose"
  | "money"
  | "mind"
  | "body"
  | "relationships"
  | "career"
  | "spirituality";

export type ArchiveContentType = "video" | "document" | "text";

interface DomainMeta {
  label: string;
  badge: string; // bg + text classes for pills
  bg: string;    // soft background for placeholder
  ring: string;  // accent color for icon
}

export const ARCHIVE_DOMAINS: Record<ArchiveDomain, DomainMeta> = {
  purpose: {
    label: "Purpose & Identity",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    bg: "bg-violet-500/10",
    ring: "text-violet-600",
  },
  money: {
    label: "Money & Wealth",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/10",
    ring: "text-emerald-600",
  },
  mind: {
    label: "Mind & Discipline",
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    bg: "bg-blue-500/10",
    ring: "text-blue-600",
  },
  body: {
    label: "Body & Health",
    badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    bg: "bg-orange-500/10",
    ring: "text-orange-600",
  },
  relationships: {
    label: "Relationships",
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    bg: "bg-rose-500/10",
    ring: "text-rose-600",
  },
  career: {
    label: "Career & Craft",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    bg: "bg-amber-500/10",
    ring: "text-amber-600",
  },
  spirituality: {
    label: "Spirituality",
    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    bg: "bg-purple-500/10",
    ring: "text-purple-600",
  },
};

export const ARCHIVE_DOMAIN_KEYS = Object.keys(ARCHIVE_DOMAINS) as ArchiveDomain[];

export const CONTENT_TYPE_LABEL: Record<ArchiveContentType, string> = {
  video: "Video",
  document: "Document",
  text: "Article",
};

export const FALLBACK_DOMAIN_META: DomainMeta = {
  label: "General",
  badge: "bg-muted text-muted-foreground",
  bg: "bg-muted",
  ring: "text-muted-foreground",
};
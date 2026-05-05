export type EventCategory = "fitness" | "brotherhood_meeting" | "social" | "founder_call" | "workshop" | "other";
export type EventFormat = "in_person" | "remote" | "hybrid";
export type RsvpStatus = "going_in_person" | "going_remote" | "not_going";

export const CATEGORY_META: Record<EventCategory, { label: string; badge: string; dot: string }> = {
  fitness:             { label: "Fitness",             badge: "bg-orange-500/15 text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  brotherhood_meeting: { label: "Brotherhood Meeting", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300",       dot: "bg-blue-500" },
  social:              { label: "Social",              badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",       dot: "bg-rose-500" },
  founder_call:        { label: "Founder Call",        badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  workshop:            { label: "Workshop",            badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",    dot: "bg-amber-500" },
  other:               { label: "Other",               badge: "bg-muted text-muted-foreground",                        dot: "bg-muted-foreground" },
};

export const FORMAT_META: Record<EventFormat, { label: string; badge: string }> = {
  in_person: { label: "In-person", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  remote:    { label: "Remote",    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  hybrid:    { label: "Hybrid",    badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_META) as EventCategory[];
export const FORMAT_KEYS = Object.keys(FORMAT_META) as EventFormat[];

export const CATEGORY_TO_DOMAIN: Record<EventCategory, string | null> = {
  fitness: "body",
  brotherhood_meeting: "mind",
  social: "relationships",
  founder_call: "purpose",
  workshop: "career",
  other: null,
};

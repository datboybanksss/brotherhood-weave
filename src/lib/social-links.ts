export const SOCIAL_PLATFORMS = [
  { platform: "instagram", label: "Instagram", placeholder: "@yourhandle" },
  { platform: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/yourname" },
  { platform: "tiktok", label: "TikTok", placeholder: "@yourhandle" },
  { platform: "x", label: "X", placeholder: "@yourhandle" },
  { platform: "youtube", label: "YouTube", placeholder: "@yourchannel" },
  { platform: "website", label: "Website", placeholder: "yourdomain.com" },
] as const;

export type SocialPlatform = typeof SOCIAL_PLATFORMS[number]["platform"];

function normalizeInstagramUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const withoutAt = raw.replace(/^@/, "");
  const candidate = /^https?:\/\//i.test(withoutAt)
    ? withoutAt
    : `https://www.instagram.com/${withoutAt}`;
  try {
    const url = new URL(candidate);
    if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return null;
    const username = url.pathname.split("/").filter(Boolean)[0];
    return username ? `https://www.instagram.com/${username}` : null;
  } catch {
    return null;
  }
}

function normalizeLinkedInUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw)
    ? raw
    : raw.includes("linkedin.com")
      ? `https://${raw}`
      : `https://www.linkedin.com/in/${raw.replace(/^@/, "")}`;
  try {
    const url = new URL(candidate);
    if (!/(^|\.)linkedin\.com$/i.test(url.hostname)) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length ? `https://www.linkedin.com/${parts.join("/")}` : null;
  } catch {
    return null;
  }
}

function normalizeTikTokUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const handle = raw.replace(/^@/, "");
  const candidate = /^https?:\/\//i.test(handle) ? handle : `https://www.tiktok.com/@${handle}`;
  try {
    const url = new URL(candidate);
    if (!/(^|\.)tiktok\.com$/i.test(url.hostname)) return null;
    const username = url.pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "");
    return username ? `https://www.tiktok.com/@${username}` : null;
  } catch {
    return null;
  }
}

function normalizeXUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const handle = raw.replace(/^@/, "");
  const candidate = /^https?:\/\//i.test(handle) ? handle : `https://x.com/${handle}`;
  try {
    const url = new URL(candidate);
    if (!/(^|\.)x\.com$/i.test(url.hostname) && !/(^|\.)twitter\.com$/i.test(url.hostname)) return null;
    const username = url.pathname.split("/").filter(Boolean)[0];
    return username ? `https://x.com/${username}` : null;
  } catch {
    return null;
  }
}

function normalizeYouTubeUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const handle = raw.replace(/^@/, "");
  const candidate = /^https?:\/\//i.test(handle) ? handle : `https://www.youtube.com/@${handle}`;
  try {
    const url = new URL(candidate);
    if (!/(^|\.)youtube\.com$/i.test(url.hostname) && !/(^|\.)youtu\.be$/i.test(url.hostname)) return null;
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeWebsiteUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes(".")) return null;
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function normalizeSocialUrl(platform: SocialPlatform, value: string | null | undefined) {
  if (platform === "instagram") return normalizeInstagramUrl(value);
  if (platform === "linkedin") return normalizeLinkedInUrl(value);
  if (platform === "tiktok") return normalizeTikTokUrl(value);
  if (platform === "x") return normalizeXUrl(value);
  if (platform === "youtube") return normalizeYouTubeUrl(value);
  return normalizeWebsiteUrl(value);
}

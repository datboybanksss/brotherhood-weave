import { act, cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import Avatar from "./Avatar";
import AvatarStack from "./home/AvatarStack";
import TierBadge from "./TierBadge";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn(() => { throw new Error("Unexpected lookup"); }) } }));

function mount(element: React.ReactNode, overrides = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["avatarUser", "member"], {
    full_name: "  Ada   Lovelace Byron ", avatar_url: null,
    ring_color: "#123456", last_seen_at: null, ...overrides,
  });
  client.setQueryData(["avatarUser", "member2"], client.getQueryData(["avatarUser", "member"]));
  client.setQueryData(["tier", "tier"], { name: "Foundation", ring_color: "#123456" });
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Avatar", () => {
  it.each([['sm', 32, 2], ['md', 40, 2], ['lg', 64, 3], ['xl', 96, 3]] as const)(
    "uses the specified %s geometry and initials", (size, photo, ring) => {
      const { container } = mount(<Avatar userId="member" size={size} />);
      expect(container.firstChild).toHaveStyle({ width: `${photo + ring * 2 + 4}px`, border: `${ring}px solid #123456` });
      expect(screen.getByText("AL")).toHaveStyle({ width: `${photo}px`, fontSize: `${photo * .35}px` });
    },
  );
  it("omits the border when a member has no tier", () => {
    const { container } = mount(<Avatar userId="member" />, { ring_color: null });
    expect((container.firstChild as HTMLElement).style.border).toBe("");
  });
  it("falls back to initials when the photo fails", () => {
    mount(<Avatar userId="member" />, { avatar_url: "/missing.jpg" });
    act(() => screen.getByRole("img").dispatchEvent(new Event("error")));
    expect(screen.getByText("AL")).toBeInTheDocument();
  });
  it("expires presence at two minutes without a refetch", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T12:00:00Z"));
    mount(<Avatar userId="member" />, { last_seen_at: "2026-09-16T11:59:00Z" });
    expect(screen.getByRole("status", { name: "Online" })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.queryByRole("status")).toBeNull();
  });
  it.each([null, "invalid", "2026-09-16T12:01:00Z", "2026-09-16T11:58:00Z"])("hides presence for %s", last_seen_at => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T12:00:00Z"));
    mount(<Avatar userId="member" />, { last_seen_at });
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("honors showStatus", () => {
    mount(<Avatar userId="member" showStatus={false} />, { last_seen_at: new Date().toISOString() });
    expect(screen.queryByRole("status")).toBeNull();
  });
});

it("masks all but the last stack tile and shows remaining members", () => {
  const { container } = mount(<AvatarStack userIds={["member", "member2"]} totalCount={5} />);
  const tiles = container.firstElementChild!.children;
  expect((tiles[0] as HTMLElement).style.maskImage).toBe("radial-gradient(circle 25px at 54px 24px, transparent 99%, black 100%)");
  expect((tiles[1] as HTMLElement).style.maskImage).toBe("");
  expect(tiles[1]).toHaveStyle({ marginLeft: "-18px" });
  expect(screen.getByText("+3 more")).toBeInTheDocument();
});

it("uses the tier row color for all badge treatments", () => {
  mount(<TierBadge tierId="tier" />);
  expect(screen.getByText("Foundation")).toHaveStyle({ color: "#123456", border: "1px solid #123456", backgroundColor: "#12345620" });
});

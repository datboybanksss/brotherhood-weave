import { Link } from "react-router-dom";
import { useMemberCarousel } from "@/hooks/useMemberCarousel";
import type { CarouselMember } from "@/api/member-carousel";

const MAX_CARDS = 5;
const CARD_W = 128;
const GAP = 12;

function Card({ m }: { m: CarouselMember }) {
  const initials = m.full_name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Link
      to={`/member/${m.id}`}
      className="relative shrink-0 rounded-2xl overflow-hidden block"
      style={{ width: CARD_W, height: 176 }}
    >
      {m.featured_url ? (
        <img
          src={m.featured_url}
          alt={m.full_name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-brand-royal text-white font-serif text-3xl">
          {initials}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-white font-semibold text-sm leading-tight truncate">
          {m.full_name.split(" ")[0]}
        </p>
        {m.department && (
          <p className="text-white/65 text-[11px] truncate">{m.department}</p>
        )}
      </div>
    </Link>
  );
}

export default function ConnectCarousel() {
  const { data: members, isLoading } = useMemberCarousel();
  if (isLoading || !members || members.length === 0) return null;

  // Newest 5 members. As soon as a 6th joins, oldest drops out.
  const visible = members.slice(0, MAX_CARDS);
  const trackWidth = visible.length * (CARD_W + GAP);
  const shouldScroll = visible.length >= 2;

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-text-muted font-medium">Connect with a brother</p>
      {/* TEMP DEBUG — remove once verified */}
      <div className="text-[10px] font-mono bg-yellow-100 text-black p-2 rounded space-y-0.5">
        <div>debug: {members.length} members from query</div>
        {members.map((m) => (
          <div key={`dbg-${m.id}`}>• {m.full_name} — {m.id}</div>
        ))}
      </div>
      <div className="overflow-hidden -mx-4 px-4">
        {shouldScroll ? (
          <div
            className="flex gap-3 pb-2 animate-marquee"
            style={{ width: trackWidth * 2, ["--marquee-distance" as any]: `-${trackWidth}px` }}
          >
            {visible.map((m) => <Card key={`a-${m.id}`} m={m} />)}
            {visible.map((m) => <Card key={`b-${m.id}`} m={m} />)}
          </div>
        ) : (
          <div className="flex gap-3 pb-2">
            {visible.map((m) => <Card key={m.id} m={m} />)}
          </div>
        )}
      </div>
    </div>
  );
}

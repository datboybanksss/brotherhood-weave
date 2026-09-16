import Avatar from "@/components/Avatar";
import { Link } from "react-router-dom";
import { useMemberCarousel } from "@/hooks/useMemberCarousel";
import type { CarouselMember } from "@/api/member-carousel";

const MAX_CARDS = 5;
const CARD_W = 128;
const GAP = 12;

function Card({ m }: { m: CarouselMember }) {
  return (
    <Link
      to={`/member/${m.id}`}
      className="relative shrink-0 rounded-2xl border border-border bg-card flex justify-center pt-3"
      style={{ width: CARD_W, height: 176 }}
    >
      <Avatar userId={m.id} size="xl" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-foreground font-semibold text-sm leading-tight truncate">
          {m.full_name.split(" ")[0]}
        </p>
        {m.department && (
          <p className="text-muted-foreground text-[11px] truncate">{m.department}</p>
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

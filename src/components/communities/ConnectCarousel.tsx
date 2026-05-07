import { Link } from "react-router-dom";
import { useMemberCarousel } from "@/hooks/useMemberCarousel";

export default function ConnectCarousel() {
  const { data: members, isLoading } = useMemberCarousel();
  if (isLoading || !members || members.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-text-muted font-medium">Connect with a brother</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {members.map((m) => (
          <Link
            key={m.id}
            to={`/member/${m.id}`}
            className="relative shrink-0 rounded-2xl overflow-hidden block"
            style={{ width: 128, height: 176 }}
          >
            <img
              src={m.featured_url}
              alt={m.full_name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
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
        ))}
      </div>
    </div>
  );
}

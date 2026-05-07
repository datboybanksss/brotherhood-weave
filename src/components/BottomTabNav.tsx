import { NavLink } from "react-router-dom";
import { useTotalUnreadCount } from "@/hooks/useTotalUnreadCount";
import EmojiIcon from "@/components/EmojiIcon";

const tabs = [
  { to: "/library",     cp: "1f4da", alt: "Books",         label: "Library" },
  { to: "/communities", cp: "1f4ac", alt: "Chat",          label: "Communities" },
  { to: "/home",        cp: "1f3e0", alt: "Home",          label: "Home" },
  { to: "/fitness",     cp: "1f4aa", alt: "Bicep",         label: "Fitness" },
  { to: "/me",          cp: "1f464", alt: "Profile",       label: "Me" },
];

export default function BottomTabNav() {
  const unread = useTotalUnreadCount();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 max-w-md mx-auto px-2">
        {tabs.map(({ to, cp, alt, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 basis-0 flex-col items-center justify-center gap-1 min-h-[48px] text-xs transition-opacity ${
                isActive ? "opacity-100" : "opacity-40"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <EmojiIcon cp={cp} alt={alt} size={24} />
                  {to === "/communities" && unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </span>
                <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

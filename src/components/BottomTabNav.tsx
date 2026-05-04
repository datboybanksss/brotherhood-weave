import { NavLink } from "react-router-dom";
import { Home, BookOpen, Dumbbell, User, MessageSquare } from "lucide-react";
import { useTotalUnreadCount } from "@/hooks/useTotalUnreadCount";

const tabs = [
  { to: "/library", icon: BookOpen, label: "Library" },
  { to: "/communities", icon: MessageSquare, label: "Communities" },
  { to: "/home", icon: Home, label: "Home" },
  { to: "/fitness", icon: Dumbbell, label: "Fitness" },
  { to: "/me", icon: User, label: "Me" },
];

export default function BottomTabNav() {
  const unread = useTotalUnreadCount();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 max-w-md mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {to === "/communities" && unread > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

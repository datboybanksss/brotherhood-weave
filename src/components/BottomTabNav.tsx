import { NavLink } from "react-router-dom";
import { Home, BookOpen, Users, User } from "lucide-react";

const tabs = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/library", icon: BookOpen, label: "Library" },
  { to: "/brotherhood", icon: Users, label: "Brotherhood" },
  { to: "/me", icon: User, label: "Me" },
];

export default function BottomTabNav() {
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
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

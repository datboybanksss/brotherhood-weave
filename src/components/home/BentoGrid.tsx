import { ReactNode, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <section
      className={cn(
        "grid grid-cols-2 md:grid-cols-4 gap-6 auto-rows-[minmax(120px,auto)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

type Span = 1 | 2 | 3 | 4;

interface BentoTileProps {
  children: ReactNode;
  /** Column span on mobile (out of 2). Default 1. */
  colBase?: Span;
  /** Column span on md+ (out of 4). Default colBase. */
  colMd?: Span;
  /** Row span on md+ . Default 1. */
  rowMd?: Span;
  variant?: "default" | "hero" | "stat";
  /** Navigate target on tile activation. */
  to?: string;
  /** Optional aria-label for navigable tiles. */
  ariaLabel?: string;
  className?: string;
}

const colBaseMap: Record<Span, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-2",
  4: "col-span-2",
};
const colMdMap: Record<Span, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
};
const rowMdMap: Record<Span, string> = {
  1: "md:row-span-1",
  2: "md:row-span-2",
  3: "md:row-span-3",
  4: "md:row-span-4",
};

export function BentoTile({
  children,
  colBase = 1,
  colMd,
  rowMd = 1,
  variant = "default",
  to,
  ariaLabel,
  className,
}: BentoTileProps) {
  const navigate = useNavigate();
  const navigable = !!to;

  const onActivate = () => {
    if (to) {
      if (/^https?:\/\//i.test(to)) {
        window.location.assign(to);
        return;
      }
      const [path, hash] = to.split("#");
      navigate(path + (hash ? `#${hash}` : ""));
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!navigable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  };

  return (
    <div
      onClick={navigable ? onActivate : undefined}
      onKeyDown={navigable ? onKeyDown : undefined}
      role={navigable ? "link" : undefined}
      tabIndex={navigable ? 0 : undefined}
      aria-label={ariaLabel}
      className={cn(
        "relative rounded-2xl border border-brand-royal/20 bg-card p-5 animate-fade-in",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal",
        navigable && "cursor-pointer hover:bg-muted/30 transition-colors duration-200",
        colBaseMap[colBase],
        colMdMap[colMd ?? colBase],
        rowMdMap[rowMd],
        className,
      )}
    >
      {children}
      {navigable && variant === "stat" && (
        <ChevronRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

/** Use to wrap interactive elements inside a navigable BentoTile so clicks don't bubble. */
export function stopTile(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

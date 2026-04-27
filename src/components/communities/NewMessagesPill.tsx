import { ArrowDown } from "lucide-react";

export default function NewMessagesPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 right-4 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
    >
      <ArrowDown className="h-3 w-3" /> New messages
    </button>
  );
}
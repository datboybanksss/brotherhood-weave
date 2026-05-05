import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogActivityDialog from "./LogActivityDialog";

export default function LogActivityFAB() {
  return (
    <div className="fixed right-4 z-[60]" style={{ bottom: "calc(4rem + env(safe-area-inset-bottom) + 0.75rem)" }}>
      <LogActivityDialog trigger={
        <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" aria-label="Log activity">
          <Plus className="h-6 w-6" />
        </Button>
      } />
    </div>
  );
}

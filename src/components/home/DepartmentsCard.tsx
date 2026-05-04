import { Link, useNavigate } from "react-router-dom";
import { Users, Star, ChevronRight } from "lucide-react";
import { useMyDepartmentChannels } from "@/hooks/useMyDepartmentChannels";
import { stopTile } from "./BentoGrid";

export default function DepartmentsCard() {
  const { data, isLoading } = useMyDepartmentChannels();
  const navigate = useNavigate();
  if (isLoading) return null;
  const depts = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> Your Departments
      </div>
      {depts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't joined a department yet. Pick up to 3 from the{" "}
          <Link to="/me" onClick={stopTile} className="underline font-medium">Me tab</Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {depts.map((d) => (
            <button
              key={d.department_id}
              onClick={(e) => {
                stopTile(e);
                if (d.channel_slug) navigate(`/communities/${d.channel_slug}`);
              }}
              disabled={!d.channel_slug}
              className="w-full flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 hover:bg-muted transition disabled:opacity-50 min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold text-sm">{d.name}</span>
                {d.is_primary && <Star className="w-3.5 h-3.5 fill-current text-amber-500" />}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

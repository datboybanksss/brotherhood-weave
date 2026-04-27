import { Link, useNavigate } from "react-router-dom";
import { Users, Star, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMyDepartmentChannels } from "@/hooks/useMyDepartmentChannels";

export default function DepartmentsCard() {
  const { data, isLoading } = useMyDepartmentChannels();
  const navigate = useNavigate();
  if (isLoading) return null;
  const depts = data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Your Departments</CardTitle>
      </CardHeader>
      <CardContent>
        {depts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't joined a department yet. Pick up to 3 from the{" "}
            <Link to="/me" className="underline font-medium">Me tab</Link> to find your people.
          </p>
        ) : (
          <div className="space-y-2">
            {depts.map((d) => (
              <button
                key={d.department_id}
                onClick={() => d.channel_slug && navigate(`/communities/${d.channel_slug}`)}
                disabled={!d.channel_slug}
                className="w-full flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 hover:bg-muted transition disabled:opacity-50"
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
      </CardContent>
    </Card>
  );
}

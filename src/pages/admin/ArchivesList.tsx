import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminArchives, deleteArchive } from "@/api/admin-archives";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminArchivesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: archives } = useQuery({ queryKey: ["adminArchives"], queryFn: getAdminArchives });

  const deleteMut = useMutation({
    mutationFn: deleteArchive,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminArchives"] }); toast.success("Deleted"); },
  });

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/me")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Archives</h1>
        <Button size="sm" onClick={() => navigate("/admin/archives/new")}><Plus className="h-4 w-4 mr-1" /> New</Button>
      </div>
      {archives?.map((a) => (
        <div key={a.id} className="flex items-center justify-between border border-border rounded-lg p-3">
          <div>
            <p className="font-medium text-foreground text-sm">{a.title}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(a.recorded_at), "MMM d, yyyy")}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/archives/${a.id}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

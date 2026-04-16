import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminPlaybooks, deletePlaybook } from "@/api/admin-playbooks";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminPlaybooksList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: playbooks } = useQuery({ queryKey: ["adminPlaybooks"], queryFn: getAdminPlaybooks });

  const deleteMut = useMutation({
    mutationFn: deletePlaybook,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminPlaybooks"] }); toast.success("Deleted"); },
  });

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/me")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Playbooks</h1>
        <Button size="sm" onClick={() => navigate("/admin/playbooks/new")}><Plus className="h-4 w-4 mr-1" /> New</Button>
      </div>
      {playbooks?.map((p) => (
        <div key={p.id} className="flex items-center justify-between border border-border rounded-lg p-3">
          <div>
            <p className="font-medium text-foreground text-sm">{p.title}</p>
            <p className="text-xs text-muted-foreground capitalize">{p.category} · {(p.author as any)?.full_name}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/playbooks/${p.id}/edit`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(p.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

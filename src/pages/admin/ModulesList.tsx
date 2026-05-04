import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminModules, deleteModule } from "@/api/admin-modules";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import AdminModuleLessons from "@/components/admin/AdminModuleLessons";

export default function AdminModulesList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: modules } = useQuery({ queryKey: ["adminModules"], queryFn: getAdminModules });
  const [openId, setOpenId] = useState<string | null>(null);

  const deleteMut = useMutation({
    mutationFn: deleteModule,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adminModules"] }); toast.success("Deleted"); },
  });

  return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/me")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Modules</h1>
        <Button size="sm" onClick={() => navigate("/admin/modules/new")}><Plus className="h-4 w-4 mr-1" /> New</Button>
      </div>
      {modules?.map((m) => (
        <div key={m.id} className="border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-left flex-1" onClick={() => setOpenId(openId === m.id ? null : m.id)}>
              {openId === m.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <div>
                <p className="font-medium text-foreground text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground">Order: {m.display_order} · {m.slug}</p>
              </div>
            </button>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/modules/${m.id}/edit`)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(m.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
          {openId === m.id && <AdminModuleLessons moduleId={m.id} />}
        </div>
      ))}
    </div>
  );
}

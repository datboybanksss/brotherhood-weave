import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";
import { uploadArchiveDocument } from "@/api/admin-archives";
import { toast } from "sonner";

interface Props {
  userId: string;
  filename: string | null;
  onChange: (path: string, name: string) => void;
}

const ALLOWED = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export default function DocumentUploadField({ userId, filename, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { toast.error("Only PDF or .docx allowed"); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("File must be ≤ 50MB"); return; }
    setBusy(true);
    const path = await uploadArchiveDocument(f, userId).catch((err) => { toast.error(err.message); return null; });
    setBusy(false);
    if (path) { onChange(path, f.name); toast.success("Document uploaded"); }
  }

  return (
    <div className="space-y-2">
      <Label>Document file (PDF or .docx)</Label>
      {filename && (
        <div className="flex items-center gap-2 text-sm text-foreground border border-border rounded-md p-2">
          <FileText className="h-4 w-4" /> <span className="truncate">{filename}</span>
        </div>
      )}
      <label>
        <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
          <span><Upload className="h-4 w-4 mr-1" />{busy ? "Uploading…" : filename ? "Replace file" : "Upload file"}</span>
        </Button>
        <input type="file" accept=".pdf,.docx" className="hidden" onChange={handle} />
      </label>
    </div>
  );
}
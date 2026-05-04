import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { uploadArchiveCover } from "@/api/admin-archives";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function CoverUploadField({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error("Cover must be ≤ 5MB"); return; }
    setBusy(true);
    const url = await uploadArchiveCover(f).catch((err) => { toast.error(err.message); return null; });
    setBusy(false);
    if (url) { onChange(url); toast.success("Cover uploaded"); }
  }

  return (
    <div className="space-y-2">
      <Label>Cover image (optional)</Label>
      {value && <img src={value} alt="cover" className="w-full max-w-xs aspect-video object-cover rounded-md border" />}
      <div className="flex gap-2">
        <label>
          <Button type="button" variant="outline" size="sm" disabled={busy} asChild>
            <span><Upload className="h-4 w-4 mr-1" />{busy ? "Uploading…" : value ? "Replace" : "Upload"}</span>
          </Button>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handle} />
        </label>
        {value && <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>Remove</Button>}
      </div>
    </div>
  );
}
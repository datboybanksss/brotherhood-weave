import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bucket: string;
  onUpload: (url: string) => void;
  currentUrl?: string | null;
}

export default function PdfUploadField({ bucket, onUpload, currentUrl }: Props) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${crypto.randomUUID()}.pdf`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onUpload(data.publicUrl);
    toast.success("PDF uploaded");
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <Label>PDF attachment</Label>
      {currentUrl && <p className="text-xs text-muted-foreground truncate">Current: {currentUrl}</p>}
      <label className="cursor-pointer">
        <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
          <span><Upload className="h-4 w-4 mr-1" />{uploading ? "Uploading…" : "Upload PDF"}</span>
        </Button>
        <input type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
      </label>
    </div>
  );
}

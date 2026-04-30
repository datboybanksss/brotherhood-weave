import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MAX_BYTES = 50 * 1024 * 1024;
const MAX_SECONDS = 60;
const ALLOWED = ["video/mp4", "video/quicktime"];

interface Props { value: File | null; onChange: (f: File | null) => void; }

export default function VideoUploader({ value, onChange }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handle = (f: File | null) => {
    if (!f) { onChange(null); setPreviewUrl(null); return; }
    if (!ALLOWED.includes(f.type)) { toast.error("Only .mp4 or .mov video files."); return; }
    if (f.size > MAX_BYTES) { toast.error("Video must be 50MB or smaller."); return; }
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      if (v.duration > MAX_SECONDS + 0.5) {
        URL.revokeObjectURL(url);
        toast.error(`Video must be ${MAX_SECONDS}s or shorter.`);
        return;
      }
      setPreviewUrl(url);
      onChange(f);
    };
    v.src = url;
  };

  return (
    <div className="space-y-2">
      <Input type="file" accept="video/mp4,video/quicktime" onChange={(e) => handle(e.target.files?.[0] ?? null)} />
      {previewUrl && value && (
        <video src={previewUrl} controls className="w-full max-h-48 rounded-md bg-black" />
      )}
    </div>
  );
}
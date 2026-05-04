import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LessonVideoEmbed from "@/components/library/LessonVideoEmbed";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

function isValid(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|vimeo\.com)/.test(url);
}

export default function VideoUrlField({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Video URL (YouTube or Vimeo)</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
      {value && isValid(value) && (
        <div className="max-w-md"><LessonVideoEmbed url={value} /></div>
      )}
      {value && !isValid(value) && (
        <p className="text-xs text-destructive">URL must be a YouTube or Vimeo link.</p>
      )}
    </div>
  );
}
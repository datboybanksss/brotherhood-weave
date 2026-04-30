import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import ExerciseSelect from "./ExerciseSelect";
import VideoUploader from "./VideoUploader";
import { isTimeBased, type ExerciseKey } from "@/lib/exercises";
import { logSubmission, uploadSubmissionVideo, attachVideoToSubmission } from "@/api/submissions";
import { useAuth } from "@/hooks/useAuth";

export default function LogActivityDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [exercise, setExercise] = useState<ExerciseKey | undefined>();
  const [reps, setReps] = useState("");
  const [note, setNote] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [retention, setRetention] = useState<"90_days" | "forever">("90_days");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const reset = () => { setExercise(undefined); setReps(""); setNote(""); setVideo(null); setRetention("90_days"); setVisibility("public"); };
  const invalidate = () => {
    ["myRecentSubmissions","fitnessLeaderboard","myMonthlyStats","myWeeklyCount","memberSubmissions","forfeitList","memberMonthlyStats"]
      .forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };

  const retryUpload = async (id: string, file: File) => {
    if (!user) return;
    const { error, path } = await uploadSubmissionVideo(file, user.id, id);
    if (error || !path) { toast.error("Retry failed.", { action: { label: "Retry", onClick: () => retryUpload(id, file) } }); return; }
    await attachVideoToSubmission(id, path);
    invalidate();
    toast.success("Video attached.");
  };

  const submit = async () => {
    if (!exercise || !user) return;
    const repsN = Number(reps);
    if (!Number.isInteger(repsN) || repsN <= 0 || repsN > 10000) { toast.error("Enter a valid number."); return; }
    setBusy(true);
    const id = crypto.randomUUID();
    const { error } = await logSubmission({
      id, exercise, reps: repsN, note,
      has_video: !!video, video_retention: retention, video_visibility: visibility,
    });
    if (error) { setBusy(false); toast.error(`Couldn't log: ${error.message}`); return; }
    if (video) {
      const up = await uploadSubmissionVideo(video, user.id, id);
      if (up.error || !up.path) {
        invalidate();
        toast("Submission logged, but video upload failed.", {
          action: { label: "Retry", onClick: () => retryUpload(id, video) },
        });
      } else {
        await attachVideoToSubmission(id, up.path);
        toast.success(`Logged: ${repsN} ${exercise.replace(/_/g, " ")}.`);
      }
    } else {
      toast.success(`Logged: ${repsN} ${exercise.replace(/_/g, " ")}.`);
    }
    invalidate(); reset(); setBusy(false); setOpen(false);
  };

  const unitLabel = exercise && isTimeBased(exercise) ? "Seconds" : "Reps";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log activity</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Exercise</Label><ExerciseSelect value={exercise} onChange={setExercise} /></div>
          <div>
            <Label>{unitLabel}</Label>
            <Input type="number" min={1} max={10000} value={reps} onChange={(e) => setReps(e.target.value)} placeholder="50" />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it feel?" />
            <div className="text-xs text-muted-foreground text-right mt-1">{note.length} / 200</div>
          </div>
          <div>
            <Label>Video (optional, ≤60s, ≤50MB)</Label>
            <VideoUploader value={video} onChange={setVideo} />
          </div>
          {video && (
            <>
              <div>
                <Label>Video retention</Label>
                <RadioGroup value={retention} onValueChange={(v) => setRetention(v as any)} className="mt-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="90_days" id="r90" /><Label htmlFor="r90" className="font-normal">Delete after 90 days</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="forever" id="rfor" /><Label htmlFor="rfor" className="font-normal">Keep forever</Label></div>
                </RadioGroup>
              </div>
              <div>
                <Label>Video visibility</Label>
                <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)} className="mt-2">
                  <div className="flex items-center gap-2"><RadioGroupItem value="public" id="vpub" /><Label htmlFor="vpub" className="font-normal">Public — visible to all members</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="private" id="vpri" /><Label htmlFor="vpri" className="font-normal">Private — only I can view</Label></div>
                </RadioGroup>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={busy || !exercise || !reps} onClick={submit}>{busy ? "Logging…" : "Log activity"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
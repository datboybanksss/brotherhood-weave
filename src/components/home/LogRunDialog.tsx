import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { logWorkout, getCollectiveDistance } from "@/api/workouts";

const schema = z.object({
  distance_km: z.coerce.number().positive({ message: "Must be positive" }).max(200, { message: "Max 200 km" }),
  ran_at: z.date(),
  note: z.string().max(200).optional(),
});
type FormData = { distance_km: number; ran_at: Date; note?: string };

const MIN_DATE = new Date("2026-01-01");

export default function LogRunDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { distance_km: undefined as any, ran_at: new Date(), note: "" },
  });
  const noteValue = form.watch("note") ?? "";

  const onSubmit = async (data: FormData) => {
    const { error } = await logWorkout({
      distance_km: Number(data.distance_km.toFixed(2)),
      ran_at: format(data.ran_at, "yyyy-MM-dd"),
      note: data.note ?? null,
    });
    if (error) {
      toast.error(`Couldn't log run: ${error.message}`);
      return;
    }
    const total = await getCollectiveDistance();
    qc.invalidateQueries({ queryKey: ["collectiveDistance"] });
    qc.invalidateQueries({ queryKey: ["recentWorkouts"] });
    toast.success(`Logged ${data.distance_km} km. Brotherhood total: ${total.toFixed(1)} km.`);
    form.reset({ distance_km: undefined as any, ran_at: new Date(), note: "" });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Log a run</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-1">
          Connected to Strava? Your runs sync automatically. Use this only for manual entries.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Distance</label>
            <div className="relative">
              <Input type="number" step="0.1" min="0.1" max="200" placeholder="5.0" {...form.register("distance_km")} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">km</span>
            </div>
            {form.formState.errors.distance_km && <p className="text-xs text-destructive mt-1">{form.formState.errors.distance_km.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" type="button" className={cn("w-full justify-start font-normal", !form.watch("ran_at") && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("ran_at") ? format(form.watch("ran_at"), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("ran_at")}
                  onSelect={(d) => d && form.setValue("ran_at", d)}
                  disabled={(d) => d > new Date() || d < MIN_DATE}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium">Note (optional)</label>
            <Textarea placeholder="How did it feel? (optional)" maxLength={200} {...form.register("note")} />
            <div className={cn("text-xs mt-1 text-right", noteValue.length > 200 ? "text-destructive" : "text-muted-foreground")}>{noteValue.length} / 200</div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>Log run</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

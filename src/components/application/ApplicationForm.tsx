import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { applicationSchema, submitApplication, type ApplicationInput } from "@/api/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ApplicationForm({ userId }: { userId: string }) {
  const [step, setStep] = useState(0);
  const qc = useQueryClient();
  const { register, trigger, handleSubmit, getValues, formState: { errors } } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationSchema), defaultValues: { city: "", occupation: "", motivation: "", contribution: "", commitment: false },
  });
  const submit = useMutation({ mutationFn: (data: ApplicationInput) => submitApplication(userId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["application", userId] }); qc.invalidateQueries({ queryKey: ["pending-approvals"] }); },
  });
  async function next() {
    const valid = await trigger(step === 0 ? ["city", "occupation"] : ["motivation", "contribution", "commitment"], { shouldFocus: true });
    if (valid) setStep(step + 1);
  }
  return <section className="rounded-2xl border border-stroke-hairline bg-white p-6 sm:p-8">
    <ol aria-label="Application progress" className="mb-8 flex gap-2">
      {["About you", "Your intentions", "Review"].map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className={`flex-1 border-t-2 pt-3 text-xs ${i <= step ? "border-brand-royal text-brand-royal" : "border-border text-muted-foreground"}`}>{i < step ? "✓" : `0${i + 1}`} · {label}</li>)}
    </ol>
    <form onSubmit={handleSubmit(data => { if (step === 2) submit.mutate(data); })} className="space-y-6">
      <div><p className="text-xs uppercase tracking-widest text-brand-royal">Membership application</p><h2 className="mt-2 font-serif text-3xl">{["Let's start with you.", "What brings you here?", "A final look."][step]}</h2><p className="mt-2 text-sm text-muted-foreground">{["A little context helps us get to know you.", "There are no perfect answers. Be honest and specific.", "Check your answers before sharing them with the founders."][step]}</p></div>
      <div hidden={step !== 0} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="city">Where are you based?</Label><Input id="city" autoComplete="address-level2" placeholder="e.g. Johannesburg" maxLength={100} {...register("city")} aria-invalid={!!errors.city} /><ErrorText message={errors.city?.message} /></div>
        <div className="space-y-2"><Label htmlFor="occupation">What do you do or study?</Label><Input id="occupation" placeholder="Your work, studies or current focus" maxLength={150} {...register("occupation")} aria-invalid={!!errors.occupation} /><ErrorText message={errors.occupation?.message} /></div>
      </div>
      <div hidden={step !== 1} className="space-y-5">
        <div className="space-y-2"><Label htmlFor="motivation">Why do you want to join Family Ties?</Label><Textarea id="motivation" rows={4} maxLength={1500} placeholder="What are you hoping to grow, change or build?" {...register("motivation")} aria-invalid={!!errors.motivation} /><ErrorText message={errors.motivation?.message} /></div>
        <div className="space-y-2"><Label htmlFor="contribution">What would you bring to the brotherhood?</Label><Textarea id="contribution" rows={4} maxLength={1500} placeholder="A perspective, skill, experience or a willingness to show up." {...register("contribution")} aria-invalid={!!errors.contribution} /><ErrorText message={errors.contribution?.message} /></div>
        <label className="flex gap-3 rounded-lg bg-surface-cream p-4 text-sm leading-6"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-brand-royal" {...register("commitment")} />I am willing to participate, respect other members and take accountability for my commitments.</label><ErrorText message={errors.commitment?.message} />
      </div>
      {step === 2 && <div className="space-y-5">{([['City', 'city'], ['Work or studies', 'occupation'], ['Why Family Ties', 'motivation'], ['Your contribution', 'contribution']] as const).map(([label, key]) => <div key={key}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{getValues(key)}</p></div>)}<p className="flex gap-2 text-sm text-state-success"><Check size={18} /> Community commitment acknowledged</p><p className="text-xs leading-5 text-muted-foreground">Your answers are visible to you and authorised administrators. Submitting an application does not guarantee membership. Read our <a href="/privacy" target="_blank" rel="noreferrer" className="underline">privacy policy</a>.</p></div>}
      {submit.isError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">We couldn't submit your application. Your answers are still here. Please try again or contact support@familyties.info.</p>}
      <div className="flex justify-between gap-3 border-t pt-5">{step > 0 ? <Button type="button" variant="ghost" disabled={submit.isPending} onClick={() => setStep(step - 1)}><ArrowLeft size={16} className="mr-2" />Back</Button> : <span className="self-center text-xs text-muted-foreground">About 5 minutes</span>}{step < 2 ? <Button key="next" type="button" className="bg-brand-royal hover:bg-brand-royal-deep" onClick={next}>Continue<ArrowRight size={16} className="ml-2" /></Button> : <Button key="submit" type="submit" disabled={submit.isPending} className="bg-brand-royal hover:bg-brand-royal-deep">{submit.isPending ? "Submitting…" : "Submit application"}</Button>}</div>
    </form>
  </section>;
}
function ErrorText({ message }: { message?: string }) { return message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null; }

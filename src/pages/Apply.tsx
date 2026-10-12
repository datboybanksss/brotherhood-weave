import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, MoveUpRight } from "lucide-react";
import CalendlyBooking from "@/components/application/CalendlyBooking";
import PublicNavigation from "@/components/PublicNavigation";
import ApplicationForm from "@/components/application/ApplicationForm";

export default function Apply() {
  const [submitted, setSubmitted] = useState(false);
  return <div className="min-h-screen bg-surface-cream font-sans text-text-ink">
    <PublicNavigation />
    <main className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:py-20">
      <section><p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-royal">The next chapter starts with you</p><h1 className="max-w-lg font-serif text-5xl leading-[1.08] sm:text-6xl">Good company.<br />Greater <span className="italic text-brand-royal">purpose.</span></h1><p className="mt-6 max-w-md text-base leading-7 text-text-muted">A brotherhood built on honest conversations, shared ambition and showing up for one another. Make your introduction to Family Ties.</p>
      <div className="mt-10 space-y-6">{[[Users, "People who show up", "Build relationships rooted in trust and accountability."], [BookOpen, "Room to grow", "Learn, share perspectives and put your intentions into practice."], [MoveUpRight, "A shared standard", "Bring your experience. Be open to learning from someone else's."]].map(([Icon, title, description]) => { const Glyph = Icon as typeof Users; return <div key={String(title)} className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-royal/20 text-brand-royal"><Glyph size={18} /></div><div><h2 className="text-sm font-semibold">{String(title)}</h2><p className="mt-1 max-w-sm text-sm leading-6 text-text-muted">{String(description)}</p></div></div>; })}</div><p className="mt-12 border-t border-stroke-hairline pt-5 text-xs leading-5 text-text-muted">An application is an introduction, not a test.<br />Be yourself. Tell us what matters to you.</p></section>
      <div>{submitted ? <Panel title="Application received."><p>Your application is on file. If you previously applied with this email, your original answers remain saved.</p><CalendlyBooking /></Panel> : <><p className="mb-4 text-sm text-text-muted">Introduce yourself, then book your applicant meeting. Founder approval is required for member access.</p><ApplicationForm onSubmitted={() => setSubmitted(true)} /></>}</div>
    </main><footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 border-t border-stroke-hairline px-6 py-6 text-xs text-text-muted"><span>FAMILY TIES · Built through participation.</span><div className="flex gap-5"><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/support">Get in touch</Link></div></footer>
  </div>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-5 rounded-2xl border border-stroke-hairline bg-white p-6 text-sm leading-6 text-text-muted sm:p-8"><p className="text-xs uppercase tracking-widest text-brand-royal">Family Ties · Membership</p><h2 className="font-serif text-3xl leading-tight text-text-ink">{title}</h2>{children}</section>; }

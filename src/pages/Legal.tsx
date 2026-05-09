import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Scale, FileText } from "lucide-react";

const effectiveDate = "May 9, 2026";
const contactEmail = "support@familyties.info";

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 rounded-lg border border-brand-royal/20 bg-card p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-royal">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-5 space-y-5 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function PolicyBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function Legal() {
  const { pathname } = useLocation();
  const label =
    pathname === "/privacy"
      ? "Privacy Policy"
      : pathname === "/terms"
        ? "Terms of Service"
        : "Legal Documents";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8">
        <header className="space-y-5 border-b border-brand-royal/15 pb-7">
          <Link to="/login" className="text-sm font-medium text-brand-royal hover:opacity-80">
            Family Ties
          </Link>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <h1 className="font-serif text-4xl font-semibold italic text-foreground sm:text-5xl">
              Policies for the brotherhood
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              These documents explain how Family Ties handles member data, what members agree to when using
              the platform, and how we align our privacy practices with South Africa's POPIA requirements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="#privacy"
              className="inline-flex items-center gap-2 rounded-full border border-brand-royal/25 bg-brand-royal-tint/50 px-4 py-2 text-sm font-semibold text-brand-royal"
            >
              <ShieldCheck className="h-4 w-4" />
              Privacy
            </a>
            <a
              href="#terms"
              className="inline-flex items-center gap-2 rounded-full border border-brand-royal/25 bg-brand-royal-tint/50 px-4 py-2 text-sm font-semibold text-brand-royal"
            >
              <Scale className="h-4 w-4" />
              Terms
            </a>
            <a
              href="#popia"
              className="inline-flex items-center gap-2 rounded-full border border-brand-royal/25 bg-brand-royal-tint/50 px-4 py-2 text-sm font-semibold text-brand-royal"
            >
              <FileText className="h-4 w-4" />
              POPIA
            </a>
          </div>
          <p className="text-xs text-muted-foreground">Effective date: {effectiveDate}</p>
        </header>

        <Section id="privacy" eyebrow="Privacy Policy" title="How Family Ties handles member information">
          <PolicyBlock title="1. Who this applies to">
            <p>
              This Privacy Policy applies to members, applicants, invited guests, and administrators who use
              Family Ties through our web app, authentication flows, community tools, fitness features, events,
              learning library, messaging, and member profile surfaces.
            </p>
          </PolicyBlock>

          <PolicyBlock title="2. Information we collect">
            <BulletList
              items={[
                "Account and profile information, including full name, email address, profile photo, city, biography, title, department, tier, membership status, onboarding state, invitation details, and admin status.",
                "Authentication information handled through our auth providers, including email sign-in and Google sign-in session data.",
                "Community information, including channel messages, direct messages, replies, reactions, attachments, voice notes, event RSVPs, and presence signals such as last seen information.",
                "Fitness information, including submitted exercises, repetitions, notes, workout dates, leaderboard scores, streaks, watchlist status, uploaded fitness videos, and Strava activity data when a member connects Strava.",
                "Learning and content information, including archive, module, lesson, playbook, worksheet, and progress activity.",
                "Contact and social information, including email visibility preferences and selected social platforms. Social links stay private unless they are verified through the relevant platform connection.",
                "Operational records, including invitations, approvals, payment or membership workflow status, email delivery logs, suppression or unsubscribe records, support requests, security logs, and technical diagnostics.",
              ]}
            />
          </PolicyBlock>

          <PolicyBlock title="3. How we use information">
            <BulletList
              items={[
                "To create and protect member accounts, verify access, run invitation and approval workflows, and maintain paid member access.",
                "To operate the community experience, including profiles, channels, direct messages, events, peer pairings, announcements, and member contact options.",
                "To support fitness accountability features such as submissions, streaks, leaderboards, weekly progress, Strava runs, video evidence, and forfeit watchlists.",
                "To deliver learning content, archive material, playbooks, worksheets, and member progress tracking.",
                "To send transactional messages about authentication, invitations, account changes, events, membership activity, and important service updates.",
                "To prevent misuse, investigate abuse, secure the platform, troubleshoot errors, and comply with legal obligations.",
              ]}
            />
          </PolicyBlock>

          <PolicyBlock title="4. Visibility inside Family Ties">
            <p>
              Family Ties is designed as a private membership community. Other paid members may see profile
              information, community posts, event participation, fitness activity, and public profile details
              that are part of the member experience. Email contact is only shown when a member enables it.
              Social profile icons are only shown after the member has verified ownership through the platform
              connection flow.
            </p>
          </PolicyBlock>

          <PolicyBlock title="5. Third-party services">
            <p>
              We use trusted service providers to operate the app, including hosting, database, authentication,
              storage, analytics or diagnostics, transactional email, payments or membership operations, Strava,
              Google, and social account verification providers such as TikTok, LinkedIn, YouTube, and X when
              those features are enabled. We do not sell member personal information.
            </p>
          </PolicyBlock>

          <PolicyBlock title="6. Social account verification">
            <p>
              If a member chooses to connect a social account, Family Ties may redirect them to that platform
              for OAuth verification. We use the result to confirm account ownership and display the verified
              profile link. We do not need to store social access tokens after the verification check unless a
              future feature clearly explains why token storage is required.
            </p>
          </PolicyBlock>

          <PolicyBlock title="7. Retention">
            <p>
              We keep personal information for as long as needed to operate Family Ties, support membership
              records, provide the community experience, meet legal or accounting duties, resolve disputes, and
              protect the platform. Some content may remain in backups or logs for a limited period after
              deletion. Members can request access, correction, deletion, or restriction where applicable.
            </p>
          </PolicyBlock>

          <PolicyBlock title="8. Security">
            <p>
              We use access controls, row-level security, authenticated sessions, private storage where
              appropriate, administrative restrictions, and provider security controls to reduce the risk of
              unauthorized access, loss, misuse, or disclosure. No online service can guarantee absolute
              security, so members should use strong account credentials and avoid sharing sensitive information
              unnecessarily in community spaces.
            </p>
          </PolicyBlock>

          <PolicyBlock title="9. Contact">
            <p>
              Privacy requests can be sent to{" "}
              <a className="font-medium text-brand-royal underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
              . Members can also contact an administrator through the platform if they need help with account
              information, visibility settings, or removal requests.
            </p>
          </PolicyBlock>
        </Section>

        <Section id="terms" eyebrow="Terms of Service" title="The agreement for using Family Ties">
          <PolicyBlock title="1. Membership and eligibility">
            <p>
              Family Ties is a private member platform. You must provide accurate information, keep your account
              secure, and only use the platform if you are permitted to join through the invitation, approval, or
              membership process. We may refuse, suspend, or remove access if the platform is misused.
            </p>
          </PolicyBlock>

          <PolicyBlock title="2. Member conduct">
            <BulletList
              items={[
                "Treat other members with respect and do not harass, threaten, impersonate, exploit, or abuse anyone.",
                "Do not post unlawful, hateful, sexually exploitative, deceptive, invasive, or harmful content.",
                "Do not upload malware, scrape member data, bypass access controls, attack the service, or interfere with other members' use of the platform.",
                "Do not share private community content outside Family Ties unless you have permission from the people involved.",
              ]}
            />
          </PolicyBlock>

          <PolicyBlock title="3. Fitness and accountability features">
            <p>
              Fitness features are for community accountability and personal tracking. They are not medical,
              health, or professional fitness advice. Members are responsible for exercising safely and seeking
              professional advice where needed. Leaderboards, streaks, watchlists, peer prompts, and forfeits are
              social accountability tools and should be used responsibly.
            </p>
          </PolicyBlock>

          <PolicyBlock title="4. Content ownership">
            <p>
              Members keep ownership of content they submit, including messages, profile details, fitness notes,
              photos, videos, and attachments. By submitting content, you give Family Ties permission to host,
              display, process, and share that content inside the platform as needed to operate the service.
            </p>
          </PolicyBlock>

          <PolicyBlock title="5. Social links and identity">
            <p>
              Members may only connect social profiles that belong to them or that they are authorized to use.
              Family Ties may hide, reject, or remove unverified, misleading, impersonating, or abusive social
              links. Verified social icons may be shown on public member profile surfaces according to the
              member's settings and the verification result.
            </p>
          </PolicyBlock>

          <PolicyBlock title="6. Payments and access">
            <p>
              Where membership fees, payment checks, or paid access are used, access may depend on successful
              completion of the required payment or approval workflow. Payment terms, refunds, renewals, and
              cancellations may be provided separately by Family Ties or the relevant payment provider.
            </p>
          </PolicyBlock>

          <PolicyBlock title="7. Third-party platforms">
            <p>
              Some features rely on third-party services such as Google, Strava, TikTok, LinkedIn, YouTube, X,
              hosting providers, storage providers, and email providers. Their own terms and privacy policies
              apply when you use their services or connect those accounts.
            </p>
          </PolicyBlock>

          <PolicyBlock title="8. Changes, suspension, and termination">
            <p>
              We may update features, policies, access rules, or these terms when needed. We may suspend or
              terminate access if a member breaks these terms, creates risk for the community, violates another
              person's rights, or uses the platform unlawfully.
            </p>
          </PolicyBlock>

          <PolicyBlock title="9. Governing law">
            <p>
              These terms are intended to be governed by the laws of South Africa, unless a mandatory law says
              otherwise.
            </p>
          </PolicyBlock>
        </Section>

        <Section id="popia" eyebrow="POPIA Notice" title="South African privacy compliance">
          <PolicyBlock title="1. Responsible party">
            <p>
              Family Ties is the responsible party for personal information processed through the platform. We
              decide why and how member information is processed for the membership community, subject to POPIA
              and other applicable law.
            </p>
          </PolicyBlock>

          <PolicyBlock title="2. POPIA processing principles">
            <p>
              We aim to process personal information according to POPIA's core conditions: accountability,
              processing limitation, purpose specification, further processing limitation, information quality,
              openness, security safeguards, and data subject participation.
            </p>
          </PolicyBlock>

          <PolicyBlock title="3. Lawful reasons for processing">
            <BulletList
              items={[
                "Consent, when members choose to provide optional information, connect third-party accounts, upload content, or show contact details.",
                "Contract or membership administration, when processing is needed to create accounts, provide the app, run approvals, manage access, and support member features.",
                "Legitimate interests, when processing is needed for community safety, accountability features, platform security, troubleshooting, fraud prevention, and service improvement.",
                "Legal obligations, when records are needed for compliance, accounting, dispute handling, regulatory duties, or lawful requests.",
              ]}
            />
          </PolicyBlock>

          <PolicyBlock title="4. Special care for fitness and media data">
            <p>
              Fitness submissions, videos, voice notes, and member media can reveal personal details. We limit
              use of this information to the member experience, accountability features, moderation, security,
              and storage purposes described in this notice.
            </p>
          </PolicyBlock>

          <PolicyBlock title="5. Data subject rights">
            <p>
              Members may request access to their personal information, correction of inaccurate information,
              deletion where legally available, objection to certain processing, withdrawal of consent where
              processing depends on consent, and information about how their data is used. Requests can be sent
              to{" "}
              <a className="font-medium text-brand-royal underline" href={`mailto:${contactEmail}`}>
                {contactEmail}
              </a>
              .
            </p>
          </PolicyBlock>

          <PolicyBlock title="6. Information Regulator">
            <p>
              If a member believes their personal information has been processed unlawfully, they may contact
              the Information Regulator of South Africa after giving Family Ties a fair chance to resolve the
              issue. POPIA complaints can be lodged through the regulator's official channels, including{" "}
              <a className="font-medium text-brand-royal underline" href="mailto:POPIAComplaints@inforegulator.org.za">
                POPIAComplaints@inforegulator.org.za
              </a>
              .
            </p>
          </PolicyBlock>
        </Section>
      </div>
    </main>
  );
}

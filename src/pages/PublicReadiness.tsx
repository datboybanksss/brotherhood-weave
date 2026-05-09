import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, LifeBuoy, LockKeyhole, ShieldAlert, Trash2 } from "lucide-react";

const contactEmail = "support@familyties.info";

type PageKey = "account-deletion" | "privacy-choices" | "support" | "community-guidelines";

const pageCopy: Record<
  PageKey,
  {
    eyebrow: string;
    title: string;
    summary: string;
    icon: typeof Trash2;
  }
> = {
  "account-deletion": {
    eyebrow: "Account deletion",
    title: "Request deletion of your Family Ties account",
    summary:
      "Members can delete their account from inside the app or request deletion by email if they cannot access their account.",
    icon: Trash2,
  },
  "privacy-choices": {
    eyebrow: "Privacy choices",
    title: "Control how your information is used",
    summary:
      "These choices explain how members can access, correct, hide, export, restrict, or delete their information.",
    icon: LockKeyhole,
  },
  support: {
    eyebrow: "Support",
    title: "Get help with Family Ties",
    summary:
      "Use this page for account help, privacy requests, safety reports, billing questions, and technical issues.",
    icon: LifeBuoy,
  },
  "community-guidelines": {
    eyebrow: "Community guidelines",
    title: "Keep the brotherhood safe and useful",
    summary:
      "Family Ties is built for trust, accountability, and respectful member-to-member participation.",
    icon: ShieldAlert,
  },
};

function currentPage(pathname: string): PageKey {
  if (pathname === "/privacy-choices") return "privacy-choices";
  if (pathname === "/support") return "support";
  if (pathname === "/community-guidelines") return "community-guidelines";
  return "account-deletion";
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-brand-royal/20 bg-card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
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

function ContactLink({ label = contactEmail }: { label?: string }) {
  return (
    <a className="font-semibold text-brand-royal underline" href={`mailto:${contactEmail}`}>
      {label}
    </a>
  );
}

export default function PublicReadiness() {
  const { pathname } = useLocation();
  const page = currentPage(pathname);
  const copy = pageCopy[page];
  const Icon = copy.icon;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/login" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand-royal">
          <ArrowLeft className="h-4 w-4" />
          Family Ties
        </Link>

        <header className="space-y-4 border-b border-brand-royal/15 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-royal/25 bg-brand-royal-tint text-brand-royal">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{copy.eyebrow}</p>
            <h1 className="font-serif text-4xl font-semibold italic text-foreground">{copy.title}</h1>
            <p className="text-base leading-8 text-muted-foreground">{copy.summary}</p>
          </div>
        </header>

        <PageBody page={page} />

        <nav className="grid gap-2 border-t border-brand-royal/15 pt-5 text-sm sm:grid-cols-2">
          <Link className="font-medium text-brand-royal underline" to="/privacy">
            Privacy Policy
          </Link>
          <Link className="font-medium text-brand-royal underline" to="/terms">
            Terms of Service
          </Link>
          <Link className="font-medium text-brand-royal underline" to="/privacy-choices">
            Privacy Choices
          </Link>
          <Link className="font-medium text-brand-royal underline" to="/community-guidelines">
            Community Guidelines
          </Link>
        </nav>
      </div>
    </main>
  );
}

function PageBody({ page }: { page: PageKey }) {
  if (page === "privacy-choices") {
    return (
      <>
        <Panel title="Choices available to members">
          <BulletList
            items={[
              "Access your profile, contact, community, learning, fitness, and account information where it is visible in the app.",
              "Correct profile details from Account settings, including name, city, biography, title, photo, email visibility, and selected social platforms.",
              "Hide optional contact details by turning off email visibility and removing social links from your profile settings.",
              "Withdraw optional social profile sharing by removing the platform or disconnecting verification when that feature is available.",
              "Request deletion, correction, restriction, or a copy of your personal information by contacting support.",
            ]}
          />
        </Panel>
        <Panel title="How to make a request">
          <p>
            Email <ContactLink /> with the subject line "Privacy request". Include the email address on your
            Family Ties account and the request you want us to handle.
          </p>
          <p>
            We may ask you to confirm account ownership before making changes, sending account information, or
            deleting data.
          </p>
        </Panel>
        <Panel title="Useful links">
          <p>
            Read the full <Link className="font-semibold text-brand-royal underline" to="/privacy">Privacy Policy</Link>,
            the <Link className="font-semibold text-brand-royal underline" to="/legal#popia">POPIA notice</Link>, or the{" "}
            <Link className="font-semibold text-brand-royal underline" to="/account-deletion">account deletion page</Link>.
          </p>
        </Panel>
      </>
    );
  }

  if (page === "support") {
    return (
      <>
        <Panel title="Contact support">
          <p>
            Email <ContactLink /> for account access, payment or membership questions, privacy requests, data
            deletion, social verification issues, technical bugs, or safety concerns.
          </p>
          <p>
            If your issue involves account access, include the email address connected to your Family Ties
            account. Do not send passwords, verification codes, or private payment details.
          </p>
        </Panel>
        <Panel title="Safety and abuse reports">
          <p>
            For harassment, impersonation, harmful content, private information exposure, or media that should be
            removed, use the subject line "Safety report" and include enough detail for an administrator to find
            the content.
          </p>
        </Panel>
        <Panel title="Account deletion">
          <p>
            Members who can access their account should use the in-app delete account option in Account settings.
            If you cannot access your account, follow the{" "}
            <Link className="font-semibold text-brand-royal underline" to="/account-deletion">
              account deletion request
            </Link>{" "}
            process.
          </p>
        </Panel>
      </>
    );
  }

  if (page === "community-guidelines") {
    return (
      <>
        <Panel title="Member standards">
          <BulletList
            items={[
              "Use your own identity and do not impersonate another person or connect social profiles that are not yours.",
              "Treat members with respect, including in channels, direct messages, reactions, events, and fitness accountability spaces.",
              "Do not harass, threaten, exploit, discriminate against, shame, or intentionally humiliate another member.",
              "Do not post unlawful, hateful, sexually exploitative, deceptive, invasive, or dangerous content.",
              "Do not share private community content outside Family Ties without permission from the people involved.",
            ]}
          />
        </Panel>
        <Panel title="Media, messages, and fitness content">
          <p>
            Members may upload photos, videos, files, voice notes, fitness evidence, and messages. Only upload
            content you have the right to share. Do not expose another member's private information, image, voice,
            or fitness activity without permission.
          </p>
        </Panel>
        <Panel title="Enforcement">
          <p>
            Family Ties may remove content, hide links, restrict features, suspend accounts, or remove members
            when content or behavior creates risk for the community. Serious reports can be sent to{" "}
            <ContactLink />.
          </p>
        </Panel>
      </>
    );
  }

  return (
    <>
      <Panel title="Delete from inside the app">
        <p>
          If you can access your Family Ties account, go to Account settings and use the Delete Account option in
          the danger zone. The app will ask you to confirm before deletion starts.
        </p>
      </Panel>
      <Panel title="Request deletion by email">
        <p>
          If you cannot access your account, email <ContactLink /> with the subject line "Account deletion
          request". Include the email address connected to your Family Ties account.
        </p>
        <p>
          We may ask you to verify account ownership before deleting the account. Once verified, we will remove
          the account and associated personal data unless we are legally required to retain limited records for
          security, dispute, accounting, fraud prevention, or compliance reasons.
        </p>
      </Panel>
      <Panel title="What deletion covers">
        <BulletList
          items={[
            "Profile information, account details, member contact settings, and selected social links.",
            "Personal fitness submissions, notes, uploaded fitness media, and connected activity records where deletion is available.",
            "Personal messages, attachments, community content, reactions, and member-generated media linked to the account, subject to legal or safety retention needs.",
            "Authentication and operational data that is no longer required to provide the service or meet legitimate retention obligations.",
          ]}
        />
      </Panel>
    </>
  );
}

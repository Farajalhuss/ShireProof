import Link from "next/link";
import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  description?: string;
  eyebrow: string;
  maxWidth?: string;
  tone?: "home" | "jobs" | "reports" | "team" | "history" | "form";
  subtitle?: string;
  title: string;
};

type CardProps = {
  children: ReactNode;
  className?: string;
};

type ButtonLinkProps = {
  children: ReactNode;
  className?: string;
  href: string;
  variant?: "primary" | "secondary" | "quiet" | "danger";
};

type EmptyStateProps = {
  action?: ReactNode;
  body: string;
  title: string;
};

type InfoBlockProps = {
  label: string;
  value: string | boolean | null | undefined;
};

type StatusPillProps = {
  status: string;
};

export const pageClass =
  "min-h-screen bg-[var(--background)] text-[var(--shire-ink)]";

export const sectionClass = "mx-auto max-w-6xl px-5 py-6 sm:px-6";

export const inputClass =
  "min-h-10 rounded-md border border-[var(--shire-border)] bg-white px-3 font-normal text-[var(--shire-ink)] outline-none transition focus:border-[var(--shire-brand)] focus:ring-4 focus:ring-teal-100";

export const textareaClass =
  "min-h-28 rounded-md border border-[var(--shire-border)] bg-white px-3 py-3 font-normal text-[var(--shire-ink)] outline-none transition focus:border-[var(--shire-brand)] focus:ring-4 focus:ring-teal-100";

export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--shire-brand)] px-3.5 text-sm font-extrabold text-white transition hover:bg-[var(--shire-brand-dark)] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white/90 px-3.5 text-sm font-extrabold text-slate-700 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-60";

export const quietButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-slate-100 px-3.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 bg-white px-3.5 text-sm font-extrabold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

export const commandStripClass =
  "grid overflow-hidden rounded-lg border border-slate-300 bg-[var(--shire-shell)] shadow-[0_12px_32px_rgba(15,23,42,0.12)]";

export const softPanelClass =
  "rounded-lg border border-[var(--shire-border)] bg-[var(--shire-surface-soft)]";

export const compactLinkClass =
  "rounded-lg bg-[var(--shire-surface-soft)] p-3 transition hover:bg-slate-100";

export const jobTicketHeaderClass =
  "flex items-center justify-between border-b border-amber-200 bg-[var(--shire-job-soft)] px-4 py-2";

export const jobLinkClass =
  "group block overflow-hidden rounded-lg border border-[var(--shire-border)] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition hover:border-amber-500 hover:shadow-[0_14px_34px_rgba(15,23,42,0.10)]";

export const reportLinkClass =
  "block rounded-lg border border-[var(--shire-border)] border-l-4 border-l-sky-600 bg-[var(--shire-surface-soft)] p-4 transition hover:border-[var(--shire-brand)] hover:bg-white hover:shadow-sm";

export const workLinkClass =
  "block rounded-lg border border-[var(--shire-border)] border-l-4 border-l-teal-700 bg-[var(--shire-surface-soft)] p-4 transition hover:border-[var(--shire-brand)] hover:bg-white hover:shadow-sm";

function buttonClass(variant: ButtonLinkProps["variant"] = "secondary") {
  if (variant === "primary") {
    return primaryButtonClass;
  }

  if (variant === "quiet") {
    return quietButtonClass;
  }

  if (variant === "danger") {
    return dangerButtonClass;
  }

  return secondaryButtonClass;
}

const headerTones = {
  form: {
    accent: "text-sky-200",
    background: "bg-[#10233f]",
    border: "border-sky-300/40",
    mark: "FR",
    markClass: "border-sky-300/30 bg-sky-300/15 text-sky-100",
    signal: "form",
  },
  history: {
    accent: "text-violet-200",
    background: "bg-[#211d4d]",
    border: "border-violet-300/40",
    mark: "HX",
    markClass: "border-violet-300/30 bg-violet-300/15 text-violet-100",
    signal: "history",
  },
  home: {
    accent: "text-cyan-200",
    background: "bg-[#101827]",
    border: "border-cyan-300/40",
    mark: "SP",
    markClass: "border-cyan-300/30 bg-cyan-300/15 text-cyan-100",
    signal: "home",
  },
  jobs: {
    accent: "text-amber-200",
    background: "bg-[#182430]",
    border: "border-amber-300/40",
    mark: "JB",
    markClass: "border-amber-300/30 bg-amber-300/15 text-amber-100",
    signal: "jobs",
  },
  reports: {
    accent: "text-emerald-200",
    background: "bg-[#10211f]",
    border: "border-emerald-300/40",
    mark: "RP",
    markClass: "border-emerald-300/30 bg-emerald-300/15 text-emerald-100",
    signal: "reports",
  },
  team: {
    accent: "text-rose-100",
    background: "bg-[#2b2032]",
    border: "border-rose-200/40",
    mark: "TM",
    markClass: "border-rose-200/30 bg-rose-200/15 text-rose-100",
    signal: "team",
  },
};

function HeaderSignal({ tone }: { tone: keyof typeof headerTones }) {
  const signal = headerTones[tone].signal;

  if (signal === "jobs") {
    return (
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[32rem] opacity-40 lg:block">
        <div className="absolute right-10 top-7 h-12 w-56 rounded-md border border-amber-200/30" />
        <div className="absolute right-24 top-14 h-12 w-56 rounded-md border border-amber-200/20" />
        <div className="absolute bottom-7 right-10 flex gap-2">
          <span className="h-2 w-28 rounded-full bg-amber-200/50" />
          <span className="h-2 w-12 rounded-full bg-teal-200/40" />
          <span className="h-2 w-20 rounded-full bg-white/20" />
        </div>
      </div>
    );
  }

  if (signal === "reports") {
    return (
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30rem] opacity-45 lg:block">
        <div className="absolute right-14 top-6 h-28 w-52 rounded-md border border-emerald-200/25 bg-white/5" />
        <div className="absolute right-24 top-12 h-1.5 w-32 rounded-full bg-emerald-200/50" />
        <div className="absolute right-24 top-20 h-1.5 w-40 rounded-full bg-white/20" />
        <div className="absolute right-24 top-28 h-1.5 w-24 rounded-full bg-white/20" />
      </div>
    );
  }

  if (signal === "team") {
    return (
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30rem] opacity-40 lg:block">
        <div className="absolute right-16 top-7 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div className="flex items-center gap-3" key={item}>
              <span className="h-8 w-8 rounded-md border border-rose-100/30 bg-rose-100/10" />
              <span className="h-2 w-40 rounded-full bg-rose-100/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (signal === "history") {
    return (
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] opacity-45 lg:block">
        <div className="absolute bottom-0 right-28 top-0 w-px bg-violet-100/25" />
        {[28, 68, 108].map((top) => (
          <span
            className="absolute right-[6.55rem] h-3 w-3 rounded-full border border-violet-100/40 bg-violet-100/20"
            key={top}
            style={{ top }}
          />
        ))}
      </div>
    );
  }

  if (signal === "form") {
    return (
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[30rem] opacity-40 lg:block">
        <div className="absolute right-14 top-7 grid w-64 grid-cols-2 gap-3">
          <span className="h-10 rounded-md border border-sky-100/25 bg-sky-100/10" />
          <span className="h-10 rounded-md border border-sky-100/25 bg-sky-100/10" />
          <span className="col-span-2 h-12 rounded-md border border-sky-100/25 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[32rem] opacity-40 lg:block">
      <div className="absolute right-12 top-8 grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <span
            className="h-10 w-24 rounded-md border border-cyan-100/20 bg-cyan-100/10"
            key={item}
          />
        ))}
      </div>
    </div>
  );
}

export function PageHeader({
  actions,
  description,
  eyebrow,
  maxWidth = "max-w-6xl",
  subtitle,
  tone = "home",
  title,
}: PageHeaderProps) {
  const theme = headerTones[tone];

  return (
    <header className={`relative overflow-hidden border-b text-white ${theme.background}`}>
      <HeaderSignal tone={tone} />
      <div
        className={`relative mx-auto flex ${maxWidth} flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6`}
      >
        <div className={`flex min-w-0 gap-3 border-l-4 pl-4 ${theme.border}`}>
          <div
            className={`hidden h-11 w-11 shrink-0 place-items-center rounded-md border text-sm font-black shadow-sm sm:grid ${theme.markClass}`}
          >
            {theme.mark}
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-black uppercase tracking-wide ${theme.accent}`}>
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-normal text-white sm:text-[2rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm font-semibold leading-6 text-white/75">
                {description}
              </p>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm font-semibold text-white/60">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-lg border border-[var(--shire-border)] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  actions,
  eyebrow,
  title,
}: {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-wide text-teal-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-lg font-black sm:text-xl">{title}</h2>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function ButtonLink({
  children,
  className = "",
  href,
  variant = "secondary",
}: ButtonLinkProps) {
  return (
    <Link className={`${buttonClass(variant)} ${className}`} href={href}>
      {children}
    </Link>
  );
}

export function InfoBlock({ label, value }: InfoBlockProps) {
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : value || "Not provided";

  return (
    <div className="rounded-lg border border-[var(--shire-border)] bg-[var(--shire-surface-soft)] p-3.5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap font-semibold text-slate-950">
        {displayValue}
      </p>
    </div>
  );
}

export function StatusPill({ status }: StatusPillProps) {
  const label = status.replace(/_/g, " ");
  const colorClass =
    status === "submitted"
      ? "bg-sky-100 text-sky-800"
      : status === "reviewed" || status === "completed" || status === "active"
        ? "bg-emerald-100 text-emerald-800"
        : status === "follow-up" || status === "invite_pending"
          ? "bg-amber-100 text-amber-800"
        : status === "in_progress"
          ? "bg-blue-100 text-blue-800"
          : status === "cancelled" || status === "deactivated"
            ? "bg-red-100 text-red-800"
            : status === "draft" || status === "open"
              ? "bg-amber-100 text-amber-800"
              : "bg-slate-200 text-slate-700";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-xs font-black uppercase ${colorClass}`}
    >
      {label}
    </span>
  );
}

export function EmptyState({ action, body, title }: EmptyStateProps) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <div className="max-w-md">
        <h3 className="text-2xl font-black">{title}</h3>
        <p className="mt-2 text-slate-600">{body}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

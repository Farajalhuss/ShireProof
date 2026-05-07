import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { pageClass } from "@/components/ui";

type AppShellProps = {
  active: "dashboard" | "jobs" | "reports" | "team" | "history";
  actions?: ReactNode;
  children: ReactNode;
  companyName: string;
  description?: string;
  eyebrow: string;
  role: string;
  subtitle?: string;
  title: string;
  tone?: "home" | "jobs" | "reports" | "team" | "history" | "form";
  userName: string;
};

const baseNavItems = [
  {
    href: "/dashboard",
    key: "dashboard",
    label: "Dashboard",
  },
  {
    href: "/jobs",
    key: "jobs",
    label: "Jobs",
  },
  {
    href: "/reports",
    key: "reports",
    label: "Reports",
  },
];

function shellNavItems(role: string) {
  const items = [...baseNavItems];

  if (role === "owner" || role === "manager") {
    items.push({
      href: "/team",
      key: "team",
      label: "Team",
    });
  }

  return items;
}

function navClass(active: boolean) {
  return `flex min-h-10 items-center rounded-md px-3 text-sm font-extrabold transition ${
    active
      ? "bg-white text-slate-950 shadow-sm"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;
}

const contextTones = {
  form: {
    accent: "border-sky-500",
    eyebrow: "text-sky-700",
    mark: "FR",
    markClass: "border-sky-200 bg-sky-50 text-sky-800",
  },
  history: {
    accent: "border-violet-500",
    eyebrow: "text-violet-700",
    mark: "HX",
    markClass: "border-violet-200 bg-violet-50 text-violet-800",
  },
  home: {
    accent: "border-cyan-500",
    eyebrow: "text-cyan-700",
    mark: "SP",
    markClass: "border-cyan-200 bg-cyan-50 text-cyan-800",
  },
  jobs: {
    accent: "border-amber-500",
    eyebrow: "text-amber-700",
    mark: "JB",
    markClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  reports: {
    accent: "border-emerald-600",
    eyebrow: "text-emerald-700",
    mark: "RP",
    markClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  team: {
    accent: "border-rose-500",
    eyebrow: "text-rose-700",
    mark: "TM",
    markClass: "border-rose-200 bg-rose-50 text-rose-800",
  },
};

function MobileNav({
  active,
  role,
}: {
  active: AppShellProps["active"];
  role: string;
}) {
  const navItems = shellNavItems(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-3 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
      <div
        className="mx-auto grid max-w-md gap-2"
        style={{
          gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
        }}
      >
        {navItems.map((item) => (
          <Link
            className={`rounded-md px-2 py-2 text-center text-xs font-black uppercase tracking-wide ${
              active === item.key
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
            href={item.href}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function AppShell({
  active,
  actions,
  children,
  companyName,
  description,
  eyebrow,
  role,
  subtitle,
  title,
  tone = "home",
  userName,
}: AppShellProps) {
  const navItems = shellNavItems(role);
  const defaultActions = actions ?? null;
  const contextTone = contextTones[tone];

  return (
    <main className={`${pageClass} pb-20 lg:pb-0`}>
      <div className="min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[var(--shire-shell)] text-white lg:block">
          <div className="sticky top-0 grid min-h-screen grid-rows-[auto_1fr_auto] p-4">
            <div>
              <Link className="flex items-center gap-3" href="/dashboard">
                <span className="grid h-11 w-11 place-items-center rounded-md border border-cyan-200/30 bg-cyan-200/10 text-sm font-black text-cyan-100">
                  SP
                </span>
                <span>
                  <span className="block text-xs font-black uppercase tracking-wide text-cyan-200">
                    ShireProof
                  </span>
                  <span className="block truncate text-sm font-extrabold text-white/75">
                    {companyName}
                  </span>
                </span>
              </Link>

              <nav className="mt-8 grid gap-2">
                {navItems.map((item) => (
                  <Link
                    className={navClass(active === item.key)}
                    href={item.href}
                    key={item.key}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div />

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="truncate text-sm font-black">{userName}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/45">
                {role}
              </p>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 bg-[var(--shire-shell)] px-5 py-3 text-white lg:hidden">
            <Link className="font-black" href="/dashboard">
              ShireProof
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                {role}
              </span>
              <LogoutButton />
            </div>
          </div>

          <header className={`border-b border-slate-200 bg-white border-l-4 ${contextTone.accent}`}>
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 gap-3">
                <span
                  className={`hidden h-10 w-10 shrink-0 place-items-center rounded-md border text-xs font-black sm:grid ${contextTone.markClass}`}
                >
                  {contextTone.mark}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-black uppercase tracking-wide ${contextTone.eyebrow}`}
                  >
                    {eyebrow}
                  </p>
                  <h1 className="mt-1 truncate text-2xl font-black tracking-normal text-slate-950">
                    {title}
                  </h1>
                  {description ? (
                    <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                      {description}
                    </p>
                  ) : null}
                  {subtitle ? (
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
              {defaultActions ? (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  {defaultActions}
                </div>
              ) : null}
            </div>
          </header>

          {children}
        </div>
      </div>
      <MobileNav active={active} role={role} />
    </main>
  );
}

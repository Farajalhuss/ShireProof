import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  EmptyState,
  StatusPill,
  inputClass,
  primaryButtonClass,
  reportLinkClass,
  sectionClass,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Profile = {
  active: boolean | null;
  company_id: string | null;
  companies: {
    name: string;
  } | null;
  full_name: string | null;
  role: string;
};

type Report = {
  created_at: string;
  id: string;
  status: string;
  title: string;
  form_data: {
    customer_name?: string;
    follow_up_required?: boolean;
    site_name?: string;
  } | null;
  technician_id: string;
  technician: {
    full_name: string | null;
  } | null;
  jobs: {
    job_number: string | null;
    title: string | null;
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

function reportMeta(report: Report) {
  const customer = report.form_data?.customer_name ?? "No customer";
  const site = report.form_data?.site_name ?? report.jobs?.title ?? "No site";

  return `${customer} - ${site}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "all" } = await searchParams;
  const searchTerm = q.trim().toLowerCase();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active, company_id, full_name, role, companies(name)")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError || !profile?.company_id || profile.active === false) {
    redirect("/dashboard");
  }

  const isTechnician = profile.role === "technician";
  const reportsQuery = supabase
    .from("reports")
    .select(
      "created_at, id, status, title, form_data, technician_id, technician:profiles!reports_technician_id_fkey(full_name), jobs!reports_job_id_fkey(job_number, title)",
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (isTechnician) {
    reportsQuery.eq("technician_id", user.id);
  }

  if (status !== "all") {
    reportsQuery.eq("status", status);
  }

  const { data: reports } = await reportsQuery.returns<Report[]>();
  const visibleReports = (reports ?? []).filter((report) => {
    const searchableText = [
      report.title,
      report.status,
      report.form_data?.customer_name,
      report.form_data?.site_name,
      report.jobs?.job_number,
      report.jobs?.title,
      report.technician?.full_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return !searchTerm || searchableText.includes(searchTerm);
  });

  return (
    <AppShell
      active="reports"
      companyName={profile.companies?.name ?? "ShireProof"}
      description={
        isTechnician
          ? "Review your drafts, submitted reports, and completed proof records."
          : "Search field reports, review submissions, and find proof records across jobs."
      }
      eyebrow="Reports"
      role={profile.role}
      tone="reports"
      title={isTechnician ? "My reports" : "Report board"}
      userName={profile.full_name ?? user.email ?? "User"}
    >
      <section className={sectionClass}>
        <section className="mb-5 rounded-lg border border-[var(--shire-border)] bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              Report filters
            </p>
          </div>
          <form className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Search reports
              <input
                className={inputClass}
                defaultValue={q}
                name="q"
                placeholder="Title, customer, site, technician"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Status
              <select className={inputClass} defaultValue={status} name="status">
                <option value="all">All reports</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </label>
            <div className="flex items-end">
              <button className={`${primaryButtonClass} w-full`} type="submit">
                Filter
              </button>
            </div>
          </form>
        </section>

        {visibleReports.length > 0 ? (
          <div className="grid gap-3">
            {visibleReports.map((report) => (
              <Link
                className={reportLinkClass}
                href={`/reports/${report.id}`}
                key={report.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-black">{report.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {reportMeta(report)}
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      {isTechnician
                        ? `Created ${formatDate(report.created_at)}`
                        : `${report.technician?.full_name ?? "Unknown technician"} - ${formatDate(report.created_at)}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {report.form_data?.follow_up_required ? (
                      <StatusPill status="follow-up" />
                    ) : null}
                    <StatusPill status={report.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              body={
                reports && reports.length > 0
                  ? "Try a different search or status filter."
                  : isTechnician
                    ? "Reports you create from assigned jobs will appear here."
                    : "Technician field reports will appear here once created."
              }
              title={
                reports && reports.length > 0
                  ? "No reports match that filter"
                  : "No reports yet"
              }
            />
          </Card>
        )}
      </section>
    </AppShell>
  );
}

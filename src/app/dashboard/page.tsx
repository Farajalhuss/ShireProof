import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  StatusPill,
  commandStripClass,
  compactLinkClass,
  reportLinkClass,
  sectionClass,
  workLinkClass,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Profile = {
  active: boolean | null;
  company_id: string | null;
  full_name: string | null;
  role: string;
  companies: {
    name: string;
    industry: string | null;
  } | null;
};

type Report = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  form_data?: {
    follow_up_required?: boolean;
  } | null;
  technician_id: string;
  technician: {
    full_name: string | null;
  } | null;
};

type Job = {
  assigned_to: string | null;
  created_at: string;
  customer_name: string | null;
  id: string;
  site_address: string | null;
  site_name: string | null;
  status: string;
  title: string | null;
};

type JobAssignment = {
  job_id: string;
  technician_id: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function jobTitle(job: Job) {
  return job.title ?? job.site_name ?? job.customer_name ?? "Untitled job";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active, company_id, full_name, role, companies(name, industry)")
    .eq("id", user.id)
    .single<Profile>();

  if (profileError || !profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6 text-slate-950">
        <section className="max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-xl">
          <p className="text-sm font-black uppercase tracking-wide text-red-700">
            Profile not connected
          </p>
          <h1 className="mt-3 text-3xl font-black">We found your login, but not your profile.</h1>
          <p className="mt-3 text-slate-600">
            Your Supabase Auth user needs a matching row in the profiles table.
            This is the company connection step we created manually earlier.
          </p>
          <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">
            User ID: {user.id}
          </p>
          {profileError ? (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
              Supabase said: {profileError.message}
            </p>
          ) : null}
          <div className="mt-5">
            <LogoutButton />
          </div>
        </section>
      </main>
    );
  }

  if (profile.active === false) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6 text-slate-950">
        <section className="max-w-lg rounded-lg border border-amber-200 bg-white p-6 shadow-xl">
          <p className="text-sm font-black uppercase tracking-wide text-amber-700">
            Account deactivated
          </p>
          <h1 className="mt-3 text-3xl font-black">Your ShireProof access is inactive.</h1>
          <p className="mt-3 text-slate-600">
            Ask a company owner to reactivate your technician profile.
          </p>
          <div className="mt-5">
            <LogoutButton />
          </div>
        </section>
      </main>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isTechnician = profile.role === "technician";
  const { data: userAssignments } = isTechnician
    ? await supabase
        .from("job_assignments")
        .select("job_id, technician_id")
        .eq("technician_id", user.id)
        .returns<JobAssignment[]>()
    : { data: [] as JobAssignment[] };
  const assignedJobIds = (userAssignments ?? []).map(
    (assignment) => assignment.job_id,
  );
  const recentReportsQuery = supabase
    .from("reports")
    .select(
      "id, title, status, created_at, technician_id, technician:profiles!reports_technician_id_fkey(full_name)",
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (isTechnician) {
    recentReportsQuery.eq("technician_id", user.id);
  }

  const jobsQuery = supabase
    .from("jobs")
    .select(
      "assigned_to, created_at, customer_name, id, site_address, site_name, status, title",
    )
    .eq("company_id", profile.company_id)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(6);

  if (isTechnician && assignedJobIds.length > 0) {
    jobsQuery.or(
      `assigned_to.eq.${user.id},id.in.(${assignedJobIds.join(",")})`,
    );
  } else if (isTechnician) {
    jobsQuery.eq("assigned_to", user.id);
  }

  const [
    { count: submittedToday },
    { count: openJobs },
    { count: technicianCount },
    { data: recentReports },
    { data: dashboardJobs },
    { data: reviewQueue },
    { count: draftCount },
    { count: reviewQueueCount },
  ] = await Promise.all([
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("status", "submitted")
      .gte("created_at", today.toISOString()),
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("role", "technician")
      .neq("active", false),
    recentReportsQuery.returns<Report[]>(),
    jobsQuery.returns<Job[]>(),
    supabase
      .from("reports")
      .select(
        "id, title, status, created_at, form_data, technician_id, technician:profiles!reports_technician_id_fkey(full_name)",
      )
      .eq("company_id", profile.company_id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true })
      .limit(6)
      .returns<Report[]>(),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("status", "draft")
      .eq("technician_id", user.id),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)
      .eq("status", "submitted"),
  ]);

  const reportStats = isTechnician
    ? [
        { label: "Submitted today", value: String(submittedToday ?? 0) },
        { label: "My drafts", value: String(draftCount ?? 0) },
        { label: "Open jobs", value: String(openJobs ?? 0) },
      ]
    : [
        { label: "Submitted today", value: String(submittedToday ?? 0) },
        { label: "Review queue", value: String(reviewQueueCount ?? 0) },
        { label: "Technicians", value: String(technicianCount ?? 0) },
      ];

  return (
    <AppShell
        actions={
          !isTechnician ? (
            <ButtonLink href="/jobs/new" variant="primary">
              New job
            </ButtonLink>
          ) : undefined
        }
        active="dashboard"
        companyName={profile.companies?.name ?? "ShireProof"}
        description={
          isTechnician
            ? "Your assigned work, draft reports, and recent field records in one place."
            : "Review submitted reports, watch open jobs, and keep the field team moving."
        }
        eyebrow={profile.companies?.name ?? "ShireProof"}
        role={profile.role}
        tone="home"
        title={isTechnician ? "Technician dashboard" : "Company dashboard"}
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section className={sectionClass}>
        <section className={`${commandStripClass} md:grid-cols-3`}>
          {reportStats.map((stat) => (
            <article
              className="border-b border-white/10 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              key={stat.label}
            >
              <p className="text-xs font-black uppercase tracking-wide text-cyan-200">
                {stat.label}
              </p>
              <strong className="mt-2 block text-4xl font-black text-white">
                {stat.value}
              </strong>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <Card className="overflow-hidden border-t-4 border-t-cyan-700">
            <CardHeader
              actions={
                !isTechnician ? (
                  <ButtonLink href="/reports?status=submitted">View all</ButtonLink>
                ) : null
              }
              eyebrow={isTechnician ? "Work" : "Needs attention"}
              title={isTechnician ? "My assigned jobs" : "Review queue"}
            />

            {isTechnician ? (
              dashboardJobs && dashboardJobs.length > 0 ? (
                <div className="grid gap-3 p-5">
                  {dashboardJobs.map((job) => (
                    <Link
                      className={workLinkClass}
                      href={`/jobs/${job.id}`}
                      key={job.id}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-black">{jobTitle(job)}</h3>
                        <StatusPill status={job.status} />
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-500">
                        {job.customer_name ?? "No customer"} -{" "}
                        {job.site_address ?? "No address"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  body="Your manager will assign jobs here. Once a job appears, open it to start a field report."
                  title="No assigned jobs"
                />
              )
            ) : reviewQueue && reviewQueue.length > 0 ? (
              <div className="grid gap-3 p-5">
                {reviewQueue.map((report) => (
                  <Link
                    className={reportLinkClass}
                    href={`/reports/${report.id}`}
                    key={report.id}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-black">{report.title}</h3>
                      <div className="flex flex-wrap justify-end gap-2">
                        {report.form_data?.follow_up_required ? (
                          <StatusPill status="follow-up" />
                        ) : null}
                        <StatusPill status={report.status} />
                      </div>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      By {report.technician?.full_name ?? "Unknown"} -{" "}
                      {formatDate(report.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                body="Submitted reports from technicians will appear here for owner or manager review."
                title="Nothing waiting for review"
              />
            )}
          </Card>

          <Card className="overflow-hidden border-t-4 border-t-teal-700">
            {isTechnician ? (
              <>
                <CardHeader
                  actions={<ButtonLink href="/reports">View all</ButtonLink>}
                  eyebrow="History"
                  title="Recent reports"
                />
                <div className="grid gap-3 p-5">
                  {recentReports && recentReports.length > 0 ? (
                    recentReports.slice(0, 4).map((report) => (
                      <Link
                        className={compactLinkClass}
                        href={`/reports/${report.id}`}
                        key={report.id}
                      >
                        <p className="font-black">{report.title}</p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {report.status} - {formatDate(report.created_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-3 font-bold text-slate-600">
                      Reports you submit from jobs will show up here.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <CardHeader eyebrow="Dispatch" title="Open jobs" />
                <div className="grid gap-3 p-5">
                  {dashboardJobs && dashboardJobs.length > 0 ? (
                    dashboardJobs.map((job) => (
                      <Link
                        className={compactLinkClass}
                        href={`/jobs/${job.id}`}
                        key={job.id}
                      >
                        <p className="font-black">{jobTitle(job)}</p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {job.customer_name ?? "No customer"} - {job.status}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="rounded-lg bg-slate-50 p-3 font-bold text-slate-600">
                      Create jobs and assign them to technicians.
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

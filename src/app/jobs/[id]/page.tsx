import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteJobButton } from "./delete-job-button";
import { JobStatusActions } from "./job-status-actions";
import { AppShell } from "@/components/app-shell";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  InfoBlock,
  StatusPill,
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

type Job = {
  assigned_to: string | null;
  company_id: string;
  created_at: string;
  customer_name: string | null;
  description: string | null;
  due_date: string | null;
  id: string;
  job_number: string | null;
  site_address: string | null;
  site_name: string | null;
  status: string;
  title: string | null;
};

type Report = {
  created_at: string;
  id: string;
  status: string;
  title: string;
};

type Technician = {
  full_name: string | null;
  id: string;
};

type JobAssignment = {
  job_id: string;
  technician_id: string;
};

type JobDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function jobTitle(job: Job) {
  return job.title ?? job.site_name ?? job.customer_name ?? "Untitled job";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
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

  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      "assigned_to, company_id, created_at, customer_name, description, due_date, id, job_number, site_address, site_name, status, title",
    )
    .eq("id", id)
    .single<Job>();

  if (error || !job || job.company_id !== profile.company_id) {
    notFound();
  }

  const { data: assignments } = await supabase
    .from("job_assignments")
    .select("job_id, technician_id")
    .eq("job_id", job.id)
    .returns<JobAssignment[]>();
  const assignedTechnicianIds = Array.from(
    new Set([
      ...(assignments ?? []).map((assignment) => assignment.technician_id),
      ...(job.assigned_to ? [job.assigned_to] : []),
    ]),
  );
  const isAssignedTechnician = assignedTechnicianIds.includes(user.id);

  if (profile.role === "technician" && !isAssignedTechnician) {
    notFound();
  }

  const canStartReport = profile.role === "technician" && isAssignedTechnician;
  const isOwner = profile.role === "owner";
  const canManageJob = profile.role === "owner" || profile.role === "manager";
  const hasSideActions = canManageJob || isOwner;

  const [{ data: reports }, { data: assignedTechnicians }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, title, status, created_at")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false })
      .returns<Report[]>(),
    assignedTechnicianIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", assignedTechnicianIds)
          .returns<Technician[]>()
      : Promise.resolve({ data: null }),
  ]);
  const assignedTechnicianNames =
    assignedTechnicians?.map(
      (technician) => technician.full_name ?? "Unnamed technician",
    ) ?? [];

  return (
      <AppShell
        active="jobs"
        companyName={profile.companies?.name ?? "ShireProof"}
        description="Dispatch details, assigned technicians, and linked field reports for this job."
        eyebrow="Job"
        role={profile.role}
        subtitle={`${job.customer_name ?? "No customer"} - ${statusLabel(job.status)}`}
        tone="jobs"
        title={jobTitle(job)}
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section
        className={`${sectionClass} grid gap-6 ${
          hasSideActions ? "lg:grid-cols-[1fr_340px]" : ""
        }`}
      >
        <div className="grid gap-6">
          {canStartReport ? (
            <Card className="overflow-hidden border-t-4 border-t-teal-700 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                    Field action
                  </p>
                  <h2 className="mt-1 text-xl font-black">Ready for a report</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Capture the work, notes, issues, materials, and photos for
                    this job.
                  </p>
                </div>
                <ButtonLink
                  className="w-full sm:w-auto"
                  href={`/reports/new?job_id=${job.id}`}
                  variant="primary"
                >
                  Start report
                </ButtonLink>
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-t-4 border-t-amber-500">
            <CardHeader eyebrow="Dispatch" title="Job details" />
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <InfoBlock label="Job number" value={job.job_number} />
              <InfoBlock
                label="Assigned technicians"
                value={assignedTechnicianNames.join(", ") || "Unassigned"}
              />
              <InfoBlock label="Site name" value={job.site_name} />
              <InfoBlock label="Site address" value={job.site_address} />
              <InfoBlock label="Due date" value={formatDate(job.due_date)} />
              <InfoBlock label="Created" value={formatDate(job.created_at)} />
            </div>
            <div className="px-5 pb-5">
              <InfoBlock label="Description" value={job.description} />
            </div>
          </Card>

          <Card className="overflow-hidden border-t-4 border-t-sky-600">
            <CardHeader
              actions={
                <span className="text-sm font-black text-slate-500">
                  {reports?.length ?? 0} total
                </span>
              }
              eyebrow="Proof"
              title="Linked reports"
            />
            {reports && reports.length > 0 ? (
              <div className="grid gap-3 p-5">
                {reports.map((report) => (
                  <Link
                    className={reportLinkClass}
                    href={`/reports/${report.id}`}
                    key={report.id}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-black">{report.title}</h3>
                      <StatusPill status={report.status} />
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-500">
                      Created {formatDate(report.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                body="Assigned technicians can start reports from this job."
                title="No reports linked yet"
              />
            )}
          </Card>
        </div>

        {hasSideActions ? (
          <aside className="grid h-fit gap-4">
            {canManageJob ? (
              <JobStatusActions currentStatus={job.status} jobId={job.id} />
            ) : null}

            {isOwner ? (
              <DeleteJobButton
                jobId={job.id}
                reportIds={(reports ?? []).map((report) => report.id)}
              />
            ) : null}
          </aside>
        ) : null}
      </section>
    </AppShell>
  );
}

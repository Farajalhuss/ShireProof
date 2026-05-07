import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  ButtonLink,
  Card,
  EmptyState,
  StatusPill,
  inputClass,
  jobLinkClass,
  jobTicketHeaderClass,
  primaryButtonClass,
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
  id: string;
  job_number: string | null;
  site_address: string | null;
  site_name: string | null;
  status: string;
  title: string | null;
};

type Technician = {
  full_name: string | null;
  id: string;
};

type JobAssignment = {
  job_id: string;
  technician_id: string;
};

function jobTitle(job: Job) {
  return job.title ?? job.site_name ?? job.customer_name ?? "Untitled job";
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "active" } = await searchParams;
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
  const canCreateJobs = profile.role === "owner" || profile.role === "manager";
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
  const jobsQuery = supabase
    .from("jobs")
    .select(
      "assigned_to, company_id, created_at, customer_name, id, job_number, site_address, site_name, status, title",
    )
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  if (isTechnician && assignedJobIds.length > 0) {
    jobsQuery.or(
      `assigned_to.eq.${user.id},id.in.(${assignedJobIds.join(",")})`,
    );
  } else if (isTechnician) {
    jobsQuery.eq("assigned_to", user.id);
  }

  const { data: jobs } = await jobsQuery.returns<Job[]>();
  const visibleJobs = (jobs ?? []).filter((job) => {
    const matchesStatus =
      status === "all"
        ? true
        : status === "active"
          ? job.status === "open" || job.status === "in_progress"
          : job.status === status;
    const searchableText = [
      job.title,
      job.job_number,
      job.customer_name,
      job.site_name,
      job.site_address,
      job.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && (!searchTerm || searchableText.includes(searchTerm));
  });
  const jobIds = visibleJobs.map((job) => job.id);
  const { data: allAssignments } =
    jobIds.length > 0
      ? await supabase
          .from("job_assignments")
          .select("job_id, technician_id")
          .in("job_id", jobIds)
          .returns<JobAssignment[]>()
      : { data: [] as JobAssignment[] };
  const assignedIds = Array.from(
    new Set([
      ...(jobs ?? []).map((job) => job.assigned_to).filter(Boolean),
      ...(allAssignments ?? []).map((assignment) => assignment.technician_id),
    ]),
  ) as string[];
  const { data: technicians } =
    assignedIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", assignedIds)
          .returns<Technician[]>()
      : { data: [] as Technician[] };
  const techniciansById = new Map(
    (technicians ?? []).map((technician) => [technician.id, technician]),
  );
  const assignmentsByJobId = new Map<string, string[]>();

  for (const assignment of allAssignments ?? []) {
    assignmentsByJobId.set(assignment.job_id, [
      ...(assignmentsByJobId.get(assignment.job_id) ?? []),
      assignment.technician_id,
    ]);
  }

  return (
    <AppShell
        active="jobs"
        actions={
          canCreateJobs ? (
            <ButtonLink href="/jobs/new" variant="primary">
              New job
            </ButtonLink>
          ) : undefined
        }
        companyName={profile.companies?.name ?? "ShireProof"}
        description={
          isTechnician
            ? "Assigned jobs grouped into a simple work list for field reporting."
            : "Dispatch work, scan assignments, and keep job status moving."
        }
        eyebrow="Jobs"
        role={profile.role}
        tone="jobs"
        title={isTechnician ? "My assigned jobs" : "Job board"}
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section className={sectionClass}>
        <section className="mb-5 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
              Dispatch filters
            </p>
          </div>
          <form className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Search jobs
              <input
                className={inputClass}
                defaultValue={q}
                name="q"
                placeholder="Customer, site, job number"
              />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-600">
              Status
              <select
                className={inputClass}
                defaultValue={status}
                name="status"
              >
                <option value="active">Active</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="all">All jobs</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                className={`${primaryButtonClass} w-full`}
                type="submit"
              >
                Filter
              </button>
            </div>
          </form>
        </section>

        {visibleJobs.length > 0 ? (
          <div className="grid gap-4">
            {visibleJobs.map((job) => (
              <Link
                className={jobLinkClass}
                href={`/jobs/${job.id}`}
                key={job.id}
              >
                <div className={jobTicketHeaderClass}>
                  <p className="text-xs font-black uppercase tracking-wide text-amber-800">
                    Job ticket
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {job.job_number ? (
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-slate-700">
                        {job.job_number}
                      </span>
                    ) : null}
                    <StatusPill status={job.status} />
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black transition group-hover:text-amber-900">
                      {jobTitle(job)}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {job.customer_name ?? "No customer"} -{" "}
                      {job.site_address ?? "No address"}
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-500">
                      Assigned to{" "}
                      {(
                        assignmentsByJobId.get(job.id) ??
                        (job.assigned_to ? [job.assigned_to] : [])
                      )
                        .map(
                          (technicianId) =>
                            techniciansById.get(technicianId)?.full_name ??
                            "Unknown technician",
                        )
                        .join(", ") || "Unassigned"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[var(--shire-border)] bg-[var(--shire-surface-soft)] px-3 py-2 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                    Open details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              action={
                canCreateJobs ? (
                  <ButtonLink href="/jobs/new" variant="primary">
                    Create job
                  </ButtonLink>
                ) : null
              }
              body={
                jobs && jobs.length > 0
                  ? "Try a different search or switch the status filter."
                  : "Create a job first, then technicians can attach field reports to that job."
              }
              title={
                jobs && jobs.length > 0
                  ? "No jobs match that filter"
                  : "No jobs yet"
              }
            />
          </Card>
        )}
      </section>
    </AppShell>
  );
}

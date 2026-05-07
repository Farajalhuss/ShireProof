import { redirect } from "next/navigation";
import { ReportForm } from "@/app/reports/report-form";
import { AppShell } from "@/components/app-shell";
import {
  ButtonLink,
  Card,
  EmptyState,
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

type Template = {
  id: string;
  name: string;
  trade: string | null;
};

type Job = {
  assigned_to?: string | null;
  id: string;
  title: string | null;
  customer_name: string | null;
  site_name: string | null;
  site_address: string | null;
};

type JobAssignment = {
  job_id: string;
  technician_id: string;
};

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ job_id?: string }>;
}) {
  const { job_id: defaultJobId = "" } = await searchParams;
  if (!defaultJobId) {
    redirect("/jobs");
  }

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

  const { data: userAssignments } =
    profile.role === "technician"
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
    .select("assigned_to, id, title, customer_name, site_name, site_address")
    .eq("company_id", profile.company_id)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false });

  if (profile.role === "technician" && assignedJobIds.length > 0) {
    jobsQuery.or(
      `assigned_to.eq.${user.id},id.in.(${assignedJobIds.join(",")})`,
    );
  } else if (profile.role === "technician") {
    jobsQuery.eq("assigned_to", user.id);
  }

  const [{ data: templates }, { data: jobs }] = await Promise.all([
    supabase
      .from("report_templates")
      .select("id, name, trade")
      .order("trade", { ascending: true })
      .order("name", { ascending: true })
      .returns<Template[]>(),
    jobsQuery.returns<Job[]>(),
  ]);

  if (!jobs || jobs.length === 0) {
    return (
      <AppShell
          active="reports"
          companyName={profile.companies?.name ?? "ShireProof"}
          description="Reports start from assigned jobs so the record stays tied to real work."
          eyebrow="New field report"
          role={profile.role}
          tone="form"
          title="Choose a job first"
          userName={profile.full_name ?? user.email ?? "User"}
        >

        <section className="mx-auto max-w-2xl px-6 py-8">
          <Card>
            <EmptyState
              action={
                <ButtonLink href="/jobs" variant="primary">
                  View jobs
                </ButtonLink>
              }
              body="Reports must be linked to a job. Ask an owner or manager to create and assign a job before starting a report."
              title="No available jobs"
            />
          </Card>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
        active="reports"
        companyName={profile.companies?.name ?? "ShireProof"}
        description="Capture what happened on site, save a draft, or submit it for review."
        eyebrow="New field report"
        role={profile.role}
        tone="form"
        title="Create report"
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section className={`${sectionClass} max-w-5xl`}>
        <Card className="overflow-hidden border-t-4 border-t-sky-600 p-5">
          <ReportForm
            companyId={profile.company_id}
            defaultJobId={defaultJobId}
            jobs={jobs ?? []}
            templates={templates ?? []}
            userId={user.id}
          />
        </Card>
      </section>
    </AppShell>
  );
}

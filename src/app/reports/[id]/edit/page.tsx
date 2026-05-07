import { notFound, redirect } from "next/navigation";
import { ReportForm } from "@/app/reports/report-form";
import { AppShell } from "@/components/app-shell";
import {
  ButtonLink,
  Card,
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

type ReportFormData = {
  customer_name?: string;
  site_name?: string;
  site_address?: string;
  job_type?: string;
  work_completed?: string;
  issues_found?: string;
  parts_used?: string;
  follow_up_required?: boolean;
};

type EditableReport = {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  job_id: string | null;
  template_id: string | null;
  form_data: ReportFormData | null;
  technician_id: string;
};

type EditReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditReportPage({ params }: EditReportPageProps) {
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

  const [{ data: report, error }, { data: templates }, { data: jobs }] =
    await Promise.all([
    supabase
      .from("reports")
      .select("id, title, status, notes, job_id, template_id, form_data, technician_id")
      .eq("id", id)
      .single<EditableReport>(),
    supabase
      .from("report_templates")
      .select("id, name, trade")
      .order("trade", { ascending: true })
      .order("name", { ascending: true })
      .returns<Template[]>(),
    jobsQuery.returns<Job[]>(),
  ]);

  if (error || !report) {
    notFound();
  }

  const canEdit =
    report.status === "draft" && report.technician_id === user.id;

  if (!canEdit) {
    redirect(`/reports/${report.id}`);
  }

  return (
    <AppShell
        active="reports"
        actions={<ButtonLink href={`/reports/${report.id}`}>Report</ButtonLink>}
        companyName={profile.companies?.name ?? "ShireProof"}
        description="Update the draft before submitting it back into the review flow."
        eyebrow="Edit draft"
        role={profile.role}
        tone="form"
        title={report.title}
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section className={`${sectionClass} max-w-5xl`}>
        <Card className="overflow-hidden border-t-4 border-t-sky-600 p-5">
          <ReportForm
            companyId={profile.company_id}
            jobs={jobs ?? []}
            report={report}
            templates={templates ?? []}
            userId={report.technician_id}
          />
        </Card>
      </section>
    </AppShell>
  );
}

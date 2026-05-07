import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionClass,
  softPanelClass,
  textareaClass,
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

type Technician = {
  full_name: string | null;
  id: string;
};

async function createJob(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, company_id, role")
    .eq("id", user.id)
    .single<Profile>();

  if (
    !profile?.company_id ||
    profile.active === false ||
    (profile.role !== "owner" && profile.role !== "manager")
  ) {
    redirect("/dashboard");
  }

  const assignedTechnicianIds = formData
    .getAll("technician_ids")
    .map((value) => String(value))
    .filter(Boolean);
  const title = String(formData.get("title") ?? "").trim();

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      assigned_to: assignedTechnicianIds[0] ?? null,
      company_id: profile.company_id,
      created_by: user.id,
      customer_name: String(formData.get("customer_name") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      due_date: String(formData.get("due_date") ?? "") || null,
      job_number: String(formData.get("job_number") ?? "").trim() || null,
      site_address: String(formData.get("site_address") ?? "").trim() || null,
      site_name: String(formData.get("site_name") ?? "").trim() || null,
      status: "open",
      title,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    redirect(`/jobs/new?message=${encodeURIComponent(error?.message ?? "Unable to create job.")}`);
  }

  if (assignedTechnicianIds.length > 0) {
    const { error: assignmentError } = await supabase
      .from("job_assignments")
      .insert(
        assignedTechnicianIds.map((technicianId) => ({
          assigned_by: user.id,
          job_id: data.id,
          technician_id: technicianId,
        })),
      );

    if (assignmentError) {
      redirect(
        `/jobs/new?message=${encodeURIComponent(
          `Job created, but technician assignment failed: ${assignmentError.message}`,
        )}`,
      );
    }
  }

  redirect(`/jobs/${data.id}`);
}

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
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

  if (
    profileError ||
    !profile?.company_id ||
    profile.active === false ||
    (profile.role !== "owner" && profile.role !== "manager")
  ) {
    redirect("/dashboard");
  }

  const { data: technicians } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", profile.company_id)
    .eq("role", "technician")
    .neq("active", false)
    .order("full_name", { ascending: true })
    .returns<Technician[]>();

  return (
      <AppShell
        active="jobs"
        companyName={profile.companies?.name ?? "ShireProof"}
        description="Create a dispatchable job, choose the site, and assign the technician crew."
        eyebrow="New job"
        role={profile.role}
        tone="jobs"
        title="Create job"
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section className={`${sectionClass} max-w-5xl`}>
        <form
          action={createJob}
          className="grid gap-5"
        >
          <Card className="grid gap-5 overflow-hidden border-t-4 border-t-amber-500 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Job title
              <input
                className={inputClass}
                name="title"
                placeholder="Rooftop unit service"
                required
              />
            </label>
            <label className="grid gap-2 font-bold">
              Job number
              <input className={inputClass} name="job_number" placeholder="JOB-1001" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Customer
              <input
                className={inputClass}
                name="customer_name"
                placeholder="Customer or client"
              />
            </label>
          </div>

          <fieldset className={`${softPanelClass} grid gap-3 border-amber-200 bg-[var(--shire-job-soft)] p-4`}>
            <legend className="px-1 text-sm font-black uppercase tracking-wide text-amber-800">
              Assign technicians
            </legend>
            {technicians && technicians.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {technicians.map((technician) => (
                  <label
                    className="flex items-center gap-3 rounded-lg border border-amber-100 bg-white p-3 font-bold shadow-sm"
                    key={technician.id}
                  >
                    <input
                      className="h-5 w-5 accent-teal-700"
                      name="technician_ids"
                      type="checkbox"
                      value={technician.id}
                    />
                    {technician.full_name ?? "Unnamed technician"}
                  </label>
                ))}
              </div>
            ) : (
              <p className="font-bold text-slate-600">
                Invite technicians before assigning this job.
              </p>
            )}
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 font-bold">
              Site name
              <input
                className={inputClass}
                name="site_name"
                placeholder="Building or project"
              />
            </label>
            <label className="grid gap-2 font-bold">
              Due date
              <input className={inputClass} name="due_date" type="date" />
            </label>
          </div>

          <label className="grid gap-2 font-bold">
            Site address
            <input className={inputClass} name="site_address" placeholder="123 Main St" />
          </label>

          <label className="grid gap-2 font-bold">
            Description
            <textarea
              className={textareaClass}
              name="description"
              placeholder="Scope, context, or dispatch notes"
            />
          </label>

          {message ? (
            <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
              Supabase said: {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Link
              className={secondaryButtonClass}
              href="/jobs"
            >
              Cancel
            </Link>
            <button
              className={primaryButtonClass}
              type="submit"
            >
              Create job
            </button>
          </div>
          </Card>
        </form>
      </section>
    </AppShell>
  );
}

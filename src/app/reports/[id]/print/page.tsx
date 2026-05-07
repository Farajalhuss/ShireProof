import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "./print-button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

type Profile = {
  active: boolean | null;
  company_id: string | null;
  companies: {
    name: string;
  } | null;
  role: string;
};

type ReportDetail = {
  company_id: string;
  created_at: string;
  form_data: ReportFormData | null;
  id: string;
  notes: string | null;
  reviewed_at: string | null;
  status: string;
  submitted_at: string | null;
  title: string;
  technician: {
    full_name: string | null;
  } | null;
  jobs: {
    customer_name: string | null;
    job_number: string | null;
    site_address: string | null;
    site_name: string | null;
    title: string | null;
  } | null;
};

type ReportPhoto = {
  created_at: string;
  id: string;
  storage_path: string;
};

type PrintReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function photoNameFromPath(path: string) {
  const fileName = path.split("/").pop() ?? "Report photo";

  return fileName.replace(/^[0-9a-f-]+-/i, "");
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function FieldBlock({
  className = "",
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string | boolean | null | undefined;
}) {
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : value || "Not provided";

  return (
    <div
      className={`rounded-md border border-slate-200 p-3 print:break-inside-avoid print:p-2.5 ${className}`}
    >
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500 print:text-[8pt]">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold text-slate-950 print:text-[9pt]">
        {displayValue}
      </p>
    </div>
  );
}

export default async function PrintReportPage({ params }: PrintReportPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, company_id, role, companies(name)")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.company_id || profile.active === false) {
    redirect("/dashboard");
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select(
      "company_id, created_at, form_data, id, notes, reviewed_at, status, submitted_at, title, technician:profiles!reports_technician_id_fkey(full_name), jobs!reports_job_id_fkey(customer_name, job_number, site_address, site_name, title)",
    )
    .eq("id", id)
    .single<ReportDetail>();

  if (error || !report || report.company_id !== profile.company_id) {
    notFound();
  }

  const { data: photos } = await supabase
    .from("report_photos")
    .select("id, storage_path, created_at")
    .eq("report_id", report.id)
    .order("created_at", { ascending: true })
    .returns<ReportPhoto[]>();

  const signedUrls =
    photos && photos.length > 0
      ? await supabase.storage
          .from("report-photos")
          .createSignedUrls(
            photos.map((photo) => photo.storage_path),
            60 * 10,
          )
      : null;

  const formData = report.form_data ?? {};
  const displayPhotos =
    photos
      ?.map((photo, index) => ({
        ...photo,
        name: photoNameFromPath(photo.storage_path),
        signedUrl: signedUrls?.data?.[index]?.signedUrl ?? null,
      }))
      .filter((photo) => photo.signedUrl) ?? [];

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-5 text-slate-950 print:bg-white print:px-0 print:py-0">
      <style>{`
        @page {
          margin: 0.45in;
        }
      `}</style>
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between print:flex-row">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-teal-700">
              {profile.companies?.name ?? "ShireProof"}
            </p>
            <h1 className="mt-1.5 text-2xl font-black print:text-[18pt]">
              {report.title}
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-slate-500">
              Customer-ready field report
            </p>
          </div>
          <div className="grid gap-2 print:hidden sm:justify-items-end">
            <PrintButton />
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-3.5 text-sm font-extrabold text-slate-700 transition hover:border-teal-600 hover:text-teal-700"
              href={`/reports/${report.id}`}
            >
              Back to report
            </Link>
          </div>
        </header>

        <section className="grid gap-3 border-b border-slate-200 py-4 md:grid-cols-4 print:grid-cols-4">
          <FieldBlock label="Status" value={statusLabel(report.status)} />
          <FieldBlock
            label="Technician"
            value={report.technician?.full_name ?? "Unknown"}
          />
          <FieldBlock label="Submitted" value={formatDate(report.submitted_at)} />
          <FieldBlock label="Reviewed" value={formatDate(report.reviewed_at)} />
        </section>

        <section className="grid gap-3 border-b border-slate-200 py-4 md:grid-cols-2 print:grid-cols-2">
          <FieldBlock
            label="Job"
            value={report.jobs?.title ?? report.jobs?.site_name ?? "Not provided"}
          />
          <FieldBlock label="Job number" value={report.jobs?.job_number} />
          <FieldBlock
            label="Customer"
            value={formData.customer_name ?? report.jobs?.customer_name}
          />
          <FieldBlock
            label="Site name"
            value={formData.site_name ?? report.jobs?.site_name}
          />
          <FieldBlock
            label="Site address"
            value={formData.site_address ?? report.jobs?.site_address}
          />
          <FieldBlock label="Job type" value={formData.job_type} />
        </section>

        <section className="grid gap-3 border-b border-slate-200 py-4 md:grid-cols-2 print:grid-cols-2">
          <h2 className="text-lg font-black md:col-span-2 print:col-span-2">
            Work summary
          </h2>
          <FieldBlock
            className="md:col-span-2 print:col-span-2"
            label="Work completed"
            value={formData.work_completed}
          />
          <FieldBlock label="Issues found" value={formData.issues_found} />
          <FieldBlock
            label="Parts or materials used"
            value={formData.parts_used}
          />
          <FieldBlock
            label="Follow-up needed"
            value={formData.follow_up_required}
          />
          <FieldBlock
            className="md:col-span-2 print:col-span-2"
            label="Extra notes"
            value={report.notes}
          />
        </section>

        <section className="py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black">Photos</h2>
            <p className="text-sm font-black text-slate-500">
              {displayPhotos.length} attached
            </p>
          </div>

          {displayPhotos.length > 0 ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
              {displayPhotos.map((photo) => (
                <figure
                  className="break-inside-avoid overflow-hidden rounded-md border border-slate-200"
                  key={photo.id}
                >
                  <div className="relative aspect-video">
                    <Image
                      alt={photo.name}
                      className="object-cover"
                      fill
                      sizes="(min-width: 768px) 420px, 100vw"
                      src={photo.signedUrl!}
                      unoptimized
                    />
                  </div>
                  <figcaption className="border-t border-slate-200 p-2 text-xs font-semibold text-slate-600">
                    {photo.name} - {formatDate(photo.created_at)}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-600">
              No photos attached.
            </p>
          )}
        </section>

        <footer className="border-t border-slate-200 pt-3 text-[11px] font-semibold text-slate-500 print:text-[8pt]">
          Generated from ShireProof on {formatDate(new Date().toISOString())}.
          This report reflects the submitted record and attached private report
          photos available at generation time.
        </footer>
      </div>
    </main>
  );
}

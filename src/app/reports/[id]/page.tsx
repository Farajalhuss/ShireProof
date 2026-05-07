import { notFound, redirect } from "next/navigation";
import { DeleteReportButton } from "./delete-report-button";
import { ReportPhotoGallery } from "./report-photo-gallery";
import { ReportPhotoUploader } from "./report-photo-uploader";
import { ReportStatusActions } from "./report-status-actions";
import { AppShell } from "@/components/app-shell";
import {
  ButtonLink,
  Card,
  CardHeader,
  InfoBlock,
  StatusPill,
  sectionClass,
  softPanelClass,
} from "@/components/ui";
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

type ReportDetail = {
  company_id: string;
  id: string;
  job_id: string | null;
  title: string;
  status: string;
  notes: string | null;
  form_data: ReportFormData | null;
  created_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  return_note: string | null;
  returned_at: string | null;
  returned_by_profile: {
    full_name: string | null;
  } | null;
  technician_id: string;
  technician: {
    full_name: string | null;
    role: string;
  } | null;
  jobs: {
    id: string;
    title: string | null;
    customer_name: string | null;
    site_name: string | null;
    status: string;
  } | null;
  report_templates: {
    name: string;
    trade: string | null;
  } | null;
};

type Profile = {
  active: boolean | null;
  company_id: string | null;
  companies: {
    name: string;
  } | null;
  role: string;
};

type ReportPhoto = {
  id: string;
  storage_path: string;
  created_at: string;
};

type DisplayPhoto = ReportPhoto & {
  signedUrl: string | null;
};

type ReportDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleString();
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | boolean | null | undefined;
}) {
  return <InfoBlock label={label} value={value} />;
}

function photoNameFromPath(path: string) {
  const fileName = path.split("/").pop() ?? "Report photo";

  return fileName.replace(/^[0-9a-f-]+-/i, "");
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
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
      "company_id, id, job_id, title, status, notes, form_data, created_at, submitted_at, reviewed_at, return_note, returned_at, returned_by_profile:profiles!reports_returned_by_fkey(full_name), technician_id, technician:profiles!reports_technician_id_fkey(full_name, role), jobs!reports_job_id_fkey(id, title, customer_name, site_name, status), report_templates(name, trade)",
    )
    .eq("id", id)
    .single<ReportDetail>();

  if (error || !report) {
    notFound();
  }

  if (report.company_id !== profile.company_id) {
    notFound();
  }

  const formData = report.form_data ?? {};
  const isOwner = profile?.role === "owner";
  const canReview = profile?.role === "owner" || profile?.role === "manager";
  const canEditReport =
    report.status === "draft" && report.technician_id === user.id;
  const canUploadPhotos = canEditReport;

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

  const displayPhotos: DisplayPhoto[] =
    photos?.map((photo, index) => ({
      ...photo,
      signedUrl: signedUrls?.data?.[index]?.signedUrl ?? null,
    })) ?? [];
  const galleryPhotos = displayPhotos
    .filter((photo) => photo.signedUrl)
    .map((photo) => ({
      createdAt: photo.created_at,
      id: photo.id,
      name: photoNameFromPath(photo.storage_path),
      signedUrl: photo.signedUrl!,
      storagePath: photo.storage_path,
    }));

  return (
    <AppShell
        active="reports"
        companyName={profile.companies?.name ?? "ShireProof"}
        description="Review the field record, technician notes, and photo evidence for this report."
        eyebrow="Field report"
        role={profile.role}
        subtitle={`Created ${formatDate(report.created_at)}`}
        tone="reports"
        title={report.title}
        userName={user.email ?? "User"}
      >

      <section className={`${sectionClass} grid gap-6 lg:grid-cols-[1fr_340px]`}>
        <div className="grid gap-6">
          <Card className="overflow-hidden border-t-4 border-t-emerald-700">
            <CardHeader
              actions={<StatusPill status={report.status} />}
              eyebrow="Record"
              title="Report details"
            />

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <DetailItem label="Customer" value={formData.customer_name} />
              <DetailItem label="Job type" value={formData.job_type} />
              <DetailItem label="Site name" value={formData.site_name} />
              <DetailItem label="Site address" value={formData.site_address} />
            </div>
          </Card>

          <Card className="overflow-hidden border-t-4 border-t-slate-700">
            <CardHeader eyebrow="Field notes" title="Technician notes" />
            <div className="grid gap-4 p-5">
              <DetailItem
                label="Work completed"
                value={formData.work_completed}
              />
              <DetailItem label="Issues found" value={formData.issues_found} />
              <DetailItem
                label="Parts or materials used"
                value={formData.parts_used}
              />
              <DetailItem
                label="Follow-up required"
                value={formData.follow_up_required}
              />
              <DetailItem label="Extra notes" value={report.notes} />
            </div>
          </Card>

          {report.return_note ? (
            <Card className="border-amber-200 bg-amber-50 p-5">
              <h2 className="text-xl font-black text-amber-950">
                Returned for changes
              </h2>
              <p className="mt-2 text-sm font-bold text-amber-700">
                {report.returned_by_profile?.full_name ?? "Manager"} returned
                this report {formatDate(report.returned_at)}.
              </p>
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-white p-4 font-bold text-amber-950">
                {report.return_note}
              </p>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-t-4 border-t-sky-600">
            <CardHeader
              actions={
                <span className="text-sm font-black text-slate-500">
                  {displayPhotos.length} uploaded
                </span>
              }
              eyebrow="Evidence"
              title="Photos"
            />

            <div className="grid gap-4 p-5">
              {canUploadPhotos ? (
                <ReportPhotoUploader
                  companyId={report.company_id}
                  jobId={report.job_id}
                  reportId={report.id}
                  userId={user.id}
                />
              ) : null}

              {displayPhotos.length > 0 ? (
                <ReportPhotoGallery
                  canDelete={canUploadPhotos}
                  photos={galleryPhotos}
                />
              ) : (
                <div className={`${softPanelClass} p-6 text-center`}>
                  <h3 className="text-lg font-black">No photos yet</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    Uploads will appear here with private signed links.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <aside className="grid h-fit gap-4">
          <ReportStatusActions
            canEditReport={canEditReport}
            canReview={canReview}
            companyId={report.company_id}
            jobId={report.job_id}
            reportId={report.id}
            status={report.status}
            userId={user.id}
          />

          <Card className="overflow-hidden border-t-4 border-t-emerald-700">
            <CardHeader
              eyebrow="Tools"
              title="Output and history"
            />
            <div className="grid gap-2 p-4">
              {report.jobs ? (
                <ButtonLink href={`/jobs/${report.jobs.id}`} variant="quiet">
                  Open linked job
                </ButtonLink>
              ) : null}
              <ButtonLink href={`/reports/${report.id}/history`} variant="quiet">
                View activity history
              </ButtonLink>
              <ButtonLink href={`/reports/${report.id}/print`} variant="primary">
                Print or save PDF
              </ButtonLink>
            </div>
          </Card>

          {isOwner ? (
            <DeleteReportButton photos={photos ?? []} reportId={report.id} />
          ) : null}
        </aside>
      </section>
    </AppShell>
  );
}

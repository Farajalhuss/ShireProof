import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  StatusPill,
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
  role: string;
};

type ReportDetail = {
  company_id: string;
  created_at: string;
  id: string;
  status: string;
  title: string;
};

type ActivityEvent = {
  actor: {
    full_name: string | null;
  } | null;
  created_at: string;
  event_type: string;
  id: string;
  message: string | null;
};

type ReportHistoryPageProps = {
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

function activityTitle(eventType: string) {
  return eventType.replace(/_/g, " ");
}

export default async function ReportHistoryPage({
  params,
}: ReportHistoryPageProps) {
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
    .select("company_id, created_at, id, status, title")
    .eq("id", id)
    .single<ReportDetail>();

  if (error || !report || report.company_id !== profile.company_id) {
    notFound();
  }

  const { data: activityEvents, error: activityError } = await supabase
    .from("activity_events")
    .select(
      "id, event_type, message, created_at, actor:profiles!activity_events_actor_id_fkey(full_name)",
    )
    .eq("report_id", report.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ActivityEvent[]>();

  return (
    <AppShell
        active="history"
        actions={<ButtonLink href={`/reports/${report.id}`}>Back to report</ButtonLink>}
        companyName={profile.companies?.name ?? "ShireProof"}
        description="A timeline of changes and workflow events attached to this proof record."
        eyebrow="Report history"
        role={profile.role}
        subtitle={`Created ${formatDate(report.created_at)}`}
        tone="history"
        title={report.title}
        userName={user.email ?? "User"}
      >

      <section className={`${sectionClass} max-w-4xl`}>
        <Card>
          <CardHeader
            actions={<StatusPill status={report.status} />}
            eyebrow="Timeline"
            title="Activity history"
          />

          {activityError ? (
            <div className="p-5">
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                Run the activity history SQL migration to start recording this
                timeline.
              </p>
            </div>
          ) : activityEvents && activityEvents.length > 0 ? (
            <div className="grid gap-0 px-5 py-2">
              {activityEvents.map((event) => (
                <div
                  className="grid gap-1 border-b border-slate-200 py-4 last:border-b-0"
                  key={event.id}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-black capitalize text-slate-950">
                      {activityTitle(event.event_type)}
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-600">
                    {event.message ?? "No details."}
                  </p>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    {event.actor?.full_name ?? "System"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              body="New report actions will appear here once the activity table exists and the report is updated."
              title="No activity recorded yet"
            />
          )}
        </Card>
      </section>
    </AppShell>
  );
}

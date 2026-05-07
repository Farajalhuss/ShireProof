import type { SupabaseClient } from "@supabase/supabase-js";

type ActivityPayload = {
  actor_id: string;
  company_id: string;
  event_type: string;
  job_id?: string | null;
  message?: string | null;
  report_id: string;
};

type ActivityInsertResult = {
  error: {
    code?: string;
    message: string;
  } | null;
};

function isMissingActivityTable(error: ActivityInsertResult["error"]) {
  return (
    error?.code === "42P01" ||
    error?.message.toLowerCase().includes("activity_events") ||
    error?.message.toLowerCase().includes("schema cache")
  );
}

export async function logReportActivity(
  supabase: Pick<SupabaseClient, "from">,
  payload: ActivityPayload,
) {
  try {
    const { error } = await supabase.from("activity_events").insert(payload);

    if (error && !isMissingActivityTable(error)) {
      console.warn("Activity log skipped:", error.message);
    }
  } catch (error) {
    if (error instanceof Error && !error.message.includes("activity_events")) {
      console.warn("Activity log skipped:", error.message);
    }
  }
}

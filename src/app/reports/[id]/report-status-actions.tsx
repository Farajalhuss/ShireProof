"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { logReportActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";

type ReportStatusActionsProps = {
  canEditReport: boolean;
  canReview: boolean;
  companyId: string;
  jobId: string | null;
  reportId: string;
  status: string;
  userId: string;
};

export function ReportStatusActions({
  canEditReport,
  canReview,
  companyId,
  jobId,
  reportId,
  status,
  userId,
}: ReportStatusActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageSource, setMessageSource] = useState<"app" | "supabase">("app");
  const [returnNote, setReturnNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasDraftActions = status === "draft" && canEditReport;
  const hasReviewActions = status === "submitted" && canReview;
  const canShowEditLink = canEditReport;
  const emptyMessage =
    status === "draft"
      ? "Waiting for the assigned technician to finish and submit this draft."
      : status === "reviewed"
        ? "This report has been reviewed and is locked."
        : "No actions are available for your role right now.";

  async function updateStatus(nextStatus: string, note?: string) {
    setMessage("");
    setMessageSource("app");

    if (nextStatus === "draft" && !note?.trim()) {
      setMessageSource("app");
      setMessage("Add a note explaining what the technician needs to change.");
      return;
    }

    setIsLoading(true);

    const payload: {
      status: string;
      return_note?: string | null;
      returned_at?: string | null;
      returned_by?: string | null;
      submitted_at?: string | null;
      reviewed_at?: string | null;
    } = { status: nextStatus };

    if (nextStatus === "submitted") {
      payload.submitted_at = new Date().toISOString();
      payload.reviewed_at = null;
      payload.return_note = null;
      payload.returned_at = null;
      payload.returned_by = null;
    }

    if (nextStatus === "reviewed") {
      payload.reviewed_at = new Date().toISOString();
    }

    if (nextStatus === "draft") {
      payload.submitted_at = null;
      payload.reviewed_at = null;
      payload.return_note = note!.trim();
      payload.returned_at = new Date().toISOString();
      payload.returned_by = userId;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("reports")
        .update(payload)
        .eq("id", reportId);

      if (error) {
        setMessageSource("supabase");
        setMessage(error.message);
        return;
      }

      await logReportActivity(supabase, {
        actor_id: userId,
        company_id: companyId,
        event_type:
          nextStatus === "reviewed"
            ? "report_reviewed"
            : nextStatus === "draft"
              ? "report_returned"
              : "report_submitted",
        job_id: jobId,
        message:
          nextStatus === "reviewed"
            ? "Report marked reviewed."
            : nextStatus === "draft"
              ? `Report returned for changes: ${note!.trim()}`
              : "Report submitted for review.",
        report_id: reportId,
      });

      setReturnNote("");
      router.refresh();
    } catch (error) {
      setMessageSource("app");
      setMessage(
        error instanceof Error ? error.message : "Unable to update status.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-teal-700">
      <CardHeader eyebrow="Workflow" title="Actions" />
      <div className="grid gap-2 p-5">
        {!canShowEditLink && !hasDraftActions && !hasReviewActions ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600">
            {emptyMessage}
          </p>
        ) : null}

        {canShowEditLink ? (
          <Link className={secondaryButtonClass} href={`/reports/${reportId}/edit`}>
            Edit report
          </Link>
        ) : null}

        {hasDraftActions ? (
          <button
            className={primaryButtonClass}
            disabled={isLoading}
            onClick={() => updateStatus("submitted")}
            type="button"
          >
            Submit report
          </button>
        ) : null}

        {hasReviewActions ? (
          <>
            <button
              className={primaryButtonClass}
              disabled={isLoading}
              onClick={() => updateStatus("reviewed")}
              type="button"
            >
              Mark reviewed
            </button>
            <button
              className={secondaryButtonClass}
              disabled={isLoading}
              onClick={() => updateStatus("draft", returnNote)}
              type="button"
            >
              Return to draft
            </button>
            <label className="grid gap-2 pt-2 text-sm font-black text-slate-700">
              Return note
              <textarea
                className={textareaClass}
                onChange={(event) => setReturnNote(event.target.value)}
                placeholder="Tell the technician what needs to be fixed"
                value={returnNote}
              />
            </label>
          </>
        ) : null}
      </div>

      {message ? (
        <p className="mx-5 mb-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
          {messageSource === "supabase" ? "Supabase said" : "Action needed"}:{" "}
          {message}
        </p>
      ) : null}
    </Card>
  );
}

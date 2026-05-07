"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { logReportActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  name: string;
  trade: string | null;
};

type Job = {
  id: string;
  title: string | null;
  customer_name: string | null;
  site_name: string | null;
  site_address: string | null;
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

type ExistingReport = {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  job_id: string | null;
  template_id: string | null;
  form_data: ReportFormData | null;
};

type ReportFormProps = {
  companyId: string;
  defaultJobId?: string;
  jobs?: Job[];
  templates: Template[];
  userId: string;
  report?: ExistingReport;
};

export function ReportForm({
  companyId,
  defaultJobId = "",
  jobs = [],
  templates,
  userId,
  report,
}: ReportFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(report?.job_id ?? defaultJobId);
  const formData = report?.form_data ?? {};
  const isEditing = Boolean(report);
  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const fieldDefaultsKey = isEditing ? report!.id : selectedJobId || "new-report";
  const titleDefault =
    report?.title ??
    selectedJob?.title ??
    selectedJob?.site_name ??
    selectedJob?.customer_name ??
    "";
  const customerDefault = formData.customer_name ?? selectedJob?.customer_name ?? "";
  const siteNameDefault = formData.site_name ?? selectedJob?.site_name ?? "";
  const siteAddressDefault = formData.site_address ?? selectedJob?.site_address ?? "";
  const jobTypeDefault = formData.job_type ?? selectedJob?.title ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const submittedForm = new FormData(event.currentTarget);
    const status = String(submittedForm.get("status") ?? "draft");
    const jobId = String(submittedForm.get("job_id") ?? "");
    const templateId = String(submittedForm.get("template_id") ?? "");
    const now = new Date().toISOString();

    if (!jobId) {
      setErrorMessage("Choose a job before saving the report.");
      setIsLoading(false);
      return;
    }

    if (!jobs.some((job) => job.id === jobId)) {
      setErrorMessage("Choose one of your available jobs.");
      setIsLoading(false);
      return;
    }

    const reportPayload = {
      company_id: companyId,
      job_id: jobId || null,
      technician_id: userId,
      template_id: templateId || null,
      title: String(submittedForm.get("title") ?? "").trim(),
      notes: String(submittedForm.get("notes") ?? "").trim() || null,
      status,
      submitted_at:
        status === "submitted" && report?.status !== "submitted"
          ? now
          : status === "submitted"
            ? undefined
            : null,
      return_note: status === "submitted" ? null : undefined,
      returned_at: status === "submitted" ? null : undefined,
      returned_by: status === "submitted" ? null : undefined,
      form_data: {
        customer_name: String(submittedForm.get("customer_name") ?? "").trim(),
        site_name: String(submittedForm.get("site_name") ?? "").trim(),
        site_address: String(submittedForm.get("site_address") ?? "").trim(),
        job_type: String(submittedForm.get("job_type") ?? "").trim(),
        work_completed: String(submittedForm.get("work_completed") ?? "").trim(),
        issues_found: String(submittedForm.get("issues_found") ?? "").trim(),
        parts_used: String(submittedForm.get("parts_used") ?? "").trim(),
        follow_up_required: submittedForm.get("follow_up_required") === "on",
      },
    };

    try {
      const supabase = createClient();
      const request = isEditing
        ? supabase.from("reports").update(reportPayload).eq("id", report!.id)
        : supabase.from("reports").insert(reportPayload);

      const { data, error } = await request.select("id").single<{ id: string }>();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      await logReportActivity(supabase, {
        actor_id: userId,
        company_id: companyId,
        event_type: isEditing
          ? status === "submitted"
            ? "report_submitted"
            : "report_draft_saved"
          : status === "submitted"
            ? "report_created_submitted"
            : "report_created_draft",
        job_id: jobId,
        message: isEditing
          ? status === "submitted"
            ? "Report submitted from draft."
            : "Draft report saved."
          : status === "submitted"
            ? "Report created and submitted."
            : "Draft report created.",
        report_id: data.id,
      });

      router.push(`/reports/${data.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save report.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 font-bold">
          Job
          <select
            className={inputClass}
            name="job_id"
            onChange={(event) => setSelectedJobId(event.target.value)}
            value={selectedJobId}
          >
            <option value="">Choose a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title ?? job.site_name ?? job.customer_name ?? "Untitled job"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 font-bold">
          Report title
          <input
            className={inputClass}
            defaultValue={titleDefault}
            key={`title-${fieldDefaultsKey}`}
            name="title"
            placeholder="Rooftop unit maintenance"
            required
          />
        </label>

        <label className="grid gap-2 font-bold">
          Template
          <select
            className={inputClass}
            defaultValue={report?.template_id ?? ""}
            name="template_id"
          >
            <option value="">General report</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.trade ? `${template.trade} - ` : ""}
                {template.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 font-bold">
          Customer name
          <input
            className={inputClass}
            defaultValue={customerDefault}
            key={`customer-${fieldDefaultsKey}`}
            name="customer_name"
            placeholder="Customer or client"
          />
        </label>

        <label className="grid gap-2 font-bold">
          Job type
          <input
            className={inputClass}
            defaultValue={jobTypeDefault}
            key={`job-type-${fieldDefaultsKey}`}
            name="job_type"
            placeholder="Maintenance, install, inspection"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 font-bold">
          Site name
          <input
            className={inputClass}
            defaultValue={siteNameDefault}
            key={`site-name-${fieldDefaultsKey}`}
            name="site_name"
            placeholder="Building, unit, or project name"
          />
        </label>

        <label className="grid gap-2 font-bold">
          Site address
          <input
            className={inputClass}
            defaultValue={siteAddressDefault}
            key={`site-address-${fieldDefaultsKey}`}
            name="site_address"
            placeholder="123 Main St"
          />
        </label>
      </div>

      <label className="grid gap-2 font-bold">
        Work completed
        <textarea
          className={textareaClass}
          defaultValue={formData.work_completed ?? ""}
          name="work_completed"
          placeholder="Summarize what was completed on site"
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 font-bold">
          Issues found
          <textarea
            className={textareaClass}
            defaultValue={formData.issues_found ?? ""}
            name="issues_found"
            placeholder="Anything damaged, missing, unsafe, or incomplete"
          />
        </label>

        <label className="grid gap-2 font-bold">
          Parts or materials used
          <textarea
            className={textareaClass}
            defaultValue={formData.parts_used ?? ""}
            name="parts_used"
            placeholder="Filters, wire, cameras, fittings, parts, materials"
          />
        </label>
      </div>

      <label className="grid gap-2 font-bold">
        Extra notes
        <textarea
          className={textareaClass}
          defaultValue={report?.notes ?? ""}
          name="notes"
          placeholder="Internal notes for managers"
        />
      </label>

      <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
        <label className="flex items-center gap-3 font-bold">
          <input
            className="h-5 w-5 accent-teal-700"
            defaultChecked={formData.follow_up_required ?? false}
            name="follow_up_required"
            type="checkbox"
          />
          Follow-up needed
        </label>
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
          Supabase said: {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Link
          className={secondaryButtonClass}
          href={report ? `/reports/${report.id}` : "/dashboard"}
        >
          Cancel
        </Link>
        <button
          className={secondaryButtonClass}
          disabled={isLoading}
          name="status"
          type="submit"
          value="draft"
        >
          {isLoading ? "Saving..." : "Save draft"}
        </button>
        <button
          className={primaryButtonClass}
          disabled={isLoading}
          name="status"
          type="submit"
          value="submitted"
        >
          {isLoading ? "Saving..." : isEditing ? "Submit changes" : "Submit report"}
        </button>
      </div>
    </form>
  );
}

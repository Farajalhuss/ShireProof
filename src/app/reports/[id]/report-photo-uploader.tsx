"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { logReportActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";

type ReportPhotoUploaderProps = {
  companyId: string;
  jobId: string | null;
  reportId: string;
  userId: string;
};

export function ReportPhotoUploader({
  companyId,
  jobId,
  reportId,
  userId,
}: ReportPhotoUploaderProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();

      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${companyId}/${reportId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(path, file, {
            contentType: file.type || undefined,
            upsert: false,
          });

        if (uploadError) {
          setMessage(uploadError.message);
          return;
        }

        const { error: insertError } = await supabase.from("report_photos").insert({
          company_id: companyId,
          report_id: reportId,
          storage_path: path,
          uploaded_by: userId,
        });

        if (insertError) {
          await supabase.storage.from("report-photos").remove([path]);
          setMessage(insertError.message);
          return;
        }
      }

      await logReportActivity(supabase, {
        actor_id: userId,
        company_id: companyId,
        event_type: "report_photos_uploaded",
        job_id: jobId,
        message:
          files.length === 1
            ? "1 report photo uploaded."
            : `${files.length} report photos uploaded.`,
        report_id: reportId,
      });

      event.target.value = "";
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to upload photos.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <label className="grid gap-2 font-bold">
        Add photos
        <input
          accept="image/*"
          className="block w-full text-sm font-bold text-slate-600 file:mr-4 file:min-h-11 file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:font-black file:text-white hover:file:bg-teal-800"
          disabled={isLoading}
          multiple
          onChange={handleFiles}
          type="file"
        />
      </label>

      {message ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
          Supabase said: {message}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DeleteJobButtonProps = {
  jobId: string;
  reportIds: string[];
};

type ReportPhoto = {
  storage_path: string;
};

export function DeleteJobButton({ jobId, reportIds }: DeleteJobButtonProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function deleteJob() {
    setMessage("");

    if (confirmation !== "DELETE") {
      setMessage("Type DELETE exactly to confirm permanent deletion.");
      return;
    }

    setIsDeleting(true);

    try {
      const supabase = createClient();

      if (reportIds.length > 0) {
        const { data: photos, error: photosError } = await supabase
          .from("report_photos")
          .select("storage_path")
          .in("report_id", reportIds)
          .returns<ReportPhoto[]>();

        if (photosError) {
          setMessage(photosError.message);
          return;
        }

        const storagePaths = (photos ?? []).map((photo) => photo.storage_path);

        if (storagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("report-photos")
            .remove(storagePaths);

          if (storageError) {
            setMessage(storageError.message);
            return;
          }
        }

        const { error: photoRowsError } = await supabase
          .from("report_photos")
          .delete()
          .in("report_id", reportIds);

        if (photoRowsError) {
          setMessage(photoRowsError.message);
          return;
        }

        const { error: reportsError } = await supabase
          .from("reports")
          .delete()
          .in("id", reportIds);

        if (reportsError) {
          setMessage(reportsError.message);
          return;
        }
      }

      const { error: assignmentError } = await supabase
        .from("job_assignments")
        .delete()
        .eq("job_id", jobId);

      if (assignmentError) {
        setMessage(assignmentError.message);
        return;
      }

      const { error: jobError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (jobError) {
        setMessage(jobError.message);
        return;
      }

      router.replace("/jobs");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete job.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black">Admin options</h2>
      {!isOpen ? (
        <>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Permanent deletion is tucked away for cleanup and mistakes.
          </p>
          <button
            className="mt-3 min-h-10 rounded-md border border-red-200 px-3.5 text-sm font-extrabold text-red-700 transition hover:bg-red-50"
            onClick={() => setIsOpen(true)}
            type="button"
          >
            Show delete
          </button>
        </>
      ) : (
        <div className="mt-3 grid gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-base font-black text-red-950">Permanent delete</h3>
          <p className="text-sm font-semibold text-red-700">
            Deleting a job permanently removes the job, its assignments, linked
            reports, report photo records, and uploaded report photos. This is
            for cleanup only and should not be used for normal completed work.
          </p>
          <p className="text-sm font-black text-red-800">
            This cannot be undone. Type DELETE to confirm.
          </p>
          <input
            className="min-h-10 rounded-md border border-red-200 px-3 font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="DELETE"
            value={confirmation}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="min-h-10 rounded-md border border-slate-300 px-3.5 text-sm font-extrabold text-slate-700 transition hover:bg-white"
              disabled={isDeleting}
              onClick={() => {
                setConfirmation("");
                setIsOpen(false);
                setMessage("");
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-10 rounded-md bg-red-700 px-3.5 text-sm font-extrabold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={deleteJob}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Permanently delete"}
            </button>
          </div>
        </div>
      )}

      {message ? (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}

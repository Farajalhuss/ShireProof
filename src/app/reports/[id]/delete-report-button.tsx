"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ReportPhoto = {
  id: string;
  storage_path: string;
};

type DeleteReportButtonProps = {
  photos: ReportPhoto[];
  reportId: string;
};

export function DeleteReportButton({ photos, reportId }: DeleteReportButtonProps) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteReport() {
    setMessage("");

    if (confirmation !== "DELETE") {
      setMessage("Type DELETE exactly to confirm permanent deletion.");
      return;
    }

    setIsDeleting(true);

    try {
      const supabase = createClient();
      const storagePaths = photos.map((photo) => photo.storage_path);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("report-photos")
          .remove(storagePaths);

        if (storageError) {
          setMessage(storageError.message);
          return;
        }
      }

      const { error: photoError } = await supabase
        .from("report_photos")
        .delete()
        .eq("report_id", reportId);

      if (photoError) {
        setMessage(photoError.message);
        return;
      }

      const { error: reportError } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (reportError) {
        setMessage(reportError.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete report.",
      );
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
            Deleting a report permanently removes the report record and its
            uploaded photos. This is mostly for test cleanup and should not be
            used for normal reviewed work.
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
              onClick={deleteReport}
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

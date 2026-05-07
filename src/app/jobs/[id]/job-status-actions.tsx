"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

type JobStatusActionsProps = {
  currentStatus: string;
  jobId: string;
};

const statuses = [
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function JobStatusActions({
  currentStatus,
  jobId,
}: JobStatusActionsProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function updateStatus(nextStatus: string) {
    if (nextStatus === currentStatus) {
      return;
    }

    setMessage("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("jobs")
        .update({
          completed_at:
            nextStatus === "completed" ? new Date().toISOString() : null,
          status: nextStatus,
        })
        .eq("id", jobId);

      if (error) {
        setMessage(error.message);
        return;
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update job status.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-teal-700">
      <CardHeader eyebrow="Workflow" title="Job status" />
      <div className="grid gap-2 p-5">
        {statuses.map((status) => (
          <button
            className={
              status.value === currentStatus
                ? primaryButtonClass
                : secondaryButtonClass
            }
            disabled={isLoading}
            key={status.value}
            onClick={() => updateStatus(status.value)}
            type="button"
          >
            {status.label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mx-5 mb-5 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
          Supabase said: {message}
        </p>
      ) : null}
    </Card>
  );
}

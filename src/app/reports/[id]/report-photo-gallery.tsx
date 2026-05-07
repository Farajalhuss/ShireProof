"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReportPhoto = {
  createdAt: string;
  id: string;
  name: string;
  signedUrl: string;
  storagePath: string;
};

type ReportPhotoGalleryProps = {
  canDelete: boolean;
  photos: ReportPhoto[];
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

function formatPhotoDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function ReportPhotoGallery({
  canDelete,
  photos,
}: ReportPhotoGalleryProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];
  const hasMultiplePhotos = photos.length > 1;

  const showPrevious = useCallback(() => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
    });
  }, [photos.length]);

  const showNext = useCallback(() => {
    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return null;
      }

      return currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
    });
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveIndex(null);
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, showNext, showPrevious]);

  async function deletePhoto(photo: ReportPhoto) {
    if (!window.confirm(`Delete ${photo.name}?`)) {
      return;
    }

    setDeleteMessage("");
    setDeletingPhotoId(photo.id);

    try {
      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from("report-photos")
        .remove([photo.storagePath]);

      if (storageError) {
        setDeleteMessage(storageError.message);
        return;
      }

      const { error: rowError } = await supabase
        .from("report_photos")
        .delete()
        .eq("id", photo.id);

      if (rowError) {
        setDeleteMessage(rowError.message);
        return;
      }

      setActiveIndex(null);
      router.refresh();
    } catch (error) {
      setDeleteMessage(
        error instanceof Error ? error.message : "Unable to delete photo.",
      );
    } finally {
      setDeletingPhotoId(null);
    }
  }

  return (
    <>
      {deleteMessage ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">
          Supabase said: {deleteMessage}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <div
            className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition hover:border-teal-600 hover:shadow-md"
            key={photo.id}
          >
            <button
              aria-label={`Open ${photo.name}`}
              className="block w-full text-left focus:outline-none focus:ring-4 focus:ring-teal-100"
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <div className="relative aspect-video w-full">
                <Image
                  alt={photo.name}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                  src={photo.signedUrl}
                  unoptimized
                />
              </div>
            </button>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 p-3 text-sm font-bold text-slate-600">
              <span className="min-w-0 truncate">
                {photo.name} - {formatPhotoDate(photo.createdAt)}
              </span>
              {canDelete ? (
                <button
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={deletingPhotoId === photo.id}
                  onClick={() => deletePhoto(photo)}
                  type="button"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {activePhoto ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 text-white"
          onClick={() => setActiveIndex(null)}
          role="dialog"
        >
          <div
            className="grid h-full max-h-[920px] w-full max-w-6xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-teal-200">
                  {activeIndex! + 1} of {photos.length}
                </p>
                <h3 className="mt-1 truncate text-base font-black">
                  {activePhoto.name}
                </h3>
              </div>
              <button
                className="min-h-10 rounded-lg bg-white/10 px-4 text-sm font-black transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/20"
                onClick={() => setActiveIndex(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="relative min-h-0 bg-slate-950">
              <Image
                alt={activePhoto.name}
                className="object-contain"
                fill
                sizes="100vw"
                src={activePhoto.signedUrl}
                unoptimized
              />

              {hasMultiplePhotos ? (
                <>
                  <button
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-2xl font-black shadow-lg ring-1 ring-white/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-white/20"
                    onClick={showPrevious}
                    type="button"
                  >
                    {"<"}
                  </button>
                  <button
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/70 text-2xl font-black shadow-lg ring-1 ring-white/15 transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-white/20"
                    onClick={showNext}
                    type="button"
                  >
                    {">"}
                  </button>
                </>
              ) : null}
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-slate-300">
                  Uploaded {formatPhotoDate(activePhoto.createdAt)}
                </p>
                {canDelete ? (
                  <button
                    className="min-h-10 rounded-lg border border-red-400/40 px-4 text-sm font-black text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deletingPhotoId === activePhoto.id}
                    onClick={() => deletePhoto(activePhoto)}
                    type="button"
                  >
                    Delete photo
                  </button>
                ) : null}
              </div>
            </div>

            {hasMultiplePhotos ? (
              <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3">
                {photos.map((photo, index) => (
                  <button
                    aria-label={`Show ${photo.name}`}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition ${
                      index === activeIndex
                        ? "border-teal-300"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                    key={photo.id}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  >
                    <Image
                      alt={photo.name}
                      className="object-cover"
                      fill
                      sizes="96px"
                      src={photo.signedUrl}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

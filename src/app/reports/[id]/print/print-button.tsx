"use client";

export function PrintButton() {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-black text-white transition hover:bg-teal-800 print:hidden"
      onClick={() => window.print()}
      type="button"
    >
      Print or save PDF
    </button>
  );
}

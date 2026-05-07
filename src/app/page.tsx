import Link from "next/link";

const workflow = [
  "Technician logs in",
  "Creates a field report",
  "Adds notes and photos",
  "Manager reviews centrally",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wide text-teal-300">
            ShireProof App Foundation
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            The first workspace for technician job reports.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This is the webapp side of ShireProof. The first build will focus on
            secure login, company-separated data, field reports, technician
            photos, and manager review.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-teal-400 px-5 font-black text-slate-950 transition hover:bg-teal-300"
              href="/login"
            >
              Go to login
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/15 px-5 font-black text-white transition hover:border-teal-300 hover:text-teal-200"
              href="/dashboard"
            >
              View dashboard shell
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-teal-700">
                MVP workflow
              </p>
              <h2 className="text-2xl font-black">Report pipeline</h2>
            </div>
            <span className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-700">
              Ready
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {workflow.map((item, index) => (
              <div
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                key={item}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">
                  {index + 1}
                </span>
                <p className="font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

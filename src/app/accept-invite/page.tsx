import { Suspense } from "react";
import Link from "next/link";
import { AcceptInviteForm } from "./accept-invite-form";

export default function AcceptInvitePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <Link className="text-sm font-bold text-teal-700" href="/">
          ShireProof
        </Link>
        <h1 className="mt-5 text-3xl font-black">Set your password</h1>
        <p className="mt-2 text-slate-600">
          Finish your technician invite and then continue to the dashboard.
        </p>

        <Suspense
          fallback={
            <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">
              Checking invite...
            </p>
          }
        >
          <AcceptInviteForm />
        </Suspense>
      </section>
    </main>
  );
}

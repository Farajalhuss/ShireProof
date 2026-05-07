"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <Link className="text-sm font-bold text-teal-700" href="/">
          ShireProof
        </Link>
        <h1 className="mt-5 text-3xl font-black">Log in</h1>
        <p className="mt-2 text-slate-600">
          Use the test user you created in Supabase Authentication.
        </p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 font-bold">
            Email
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 font-bold">
            Password
            <input
              className="min-h-12 rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your Supabase user password"
              required
              type="password"
              value={password}
            />
          </label>
          <button
            className="min-h-12 rounded-lg bg-slate-950 px-4 font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}

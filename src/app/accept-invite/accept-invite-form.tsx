"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking invite...");
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkInviteSession() {
      const message = searchParams.get("message");

      if (message) {
        setMessage(message);
      }

      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage(error.message);
          return;
        }

        window.history.replaceState(null, "", "/accept-invite");
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        window.history.replaceState(null, "", "/accept-invite");
      }

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data.session) {
        setMessage(
          "Open this page from the invite email link so ShireProof can verify the invitation.",
        );
        return;
      }

      setIsReady(true);
      setMessage("");
    }

    checkInviteSession();
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Use at least 8 characters for the password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        return;
      }

      const response = await fetch("/api/profiles/complete", {
        method: "POST",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setMessage(result.error ?? "Unable to finish profile setup.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to accept invite.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 font-bold">
          Password
          <input
            className="min-h-12 rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            disabled={!isReady || isLoading}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            type="password"
            value={password}
          />
        </label>
        <label className="grid gap-2 font-bold">
          Confirm password
          <input
            className="min-h-12 rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            disabled={!isReady || isLoading}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter password"
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        <button
          className="min-h-12 rounded-lg bg-teal-700 px-4 font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!isReady || isLoading}
          type="submit"
        >
          {isLoading ? "Saving..." : "Create password"}
        </button>
      </form>

      {message ? (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-sm font-bold text-slate-700">
          {message}
        </p>
      ) : null}
    </>
  );
}

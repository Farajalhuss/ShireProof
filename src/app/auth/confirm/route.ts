import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowedNextPaths = new Set(["/accept-invite", "/dashboard"]);

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return allowedNextPaths.has(value) ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const redirectTo = request.nextUrl.clone();

  redirectTo.pathname = next;
  redirectTo.search = "";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }

    redirectTo.pathname = "/accept-invite";
    redirectTo.searchParams.set("message", error.message);
    return NextResponse.redirect(redirectTo);
  }

  redirectTo.pathname = "/accept-invite";
  redirectTo.searchParams.set("message", "Invite link is missing its token.");
  return NextResponse.redirect(redirectTo);
}

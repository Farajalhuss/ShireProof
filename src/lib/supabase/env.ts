export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }

  return { supabasePublishableKey, supabaseUrl };
}

export function getSiteUrl(origin?: string | null) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  const url = configuredUrl || origin || "http://localhost:3000";
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  return normalizedUrl.replace(/\/$/, "");
}

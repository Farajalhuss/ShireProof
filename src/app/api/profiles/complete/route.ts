import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type InviteMetadata = {
  company_id?: string;
  full_name?: string;
  role?: string;
};

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const metadata = user.user_metadata as InviteMetadata;

  if (!metadata.company_id) {
    return NextResponse.json(
      { error: "Invite is missing a company connection." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json(
      { error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      active: true,
      company_id: metadata.company_id,
      full_name: metadata.full_name ?? null,
      id: user.id,
      role: metadata.role ?? "technician",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    const message = profileError.message.includes("permission denied")
      ? "Supabase needs table grants for public.profiles before profile setup can finish."
      : profileError.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

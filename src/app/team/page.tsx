import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardHeader,
  StatusPill,
  inputClass,
  primaryButtonClass,
  sectionClass,
  softPanelClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";

type TeamPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

type Profile = {
  active: boolean | null;
  company_id: string | null;
  companies?: {
    name: string;
  } | null;
  full_name: string | null;
  role: string;
};

type TeamMember = {
  active: boolean | null;
  email: string | null;
  emailConfirmedAt: string | null;
  id: string;
  full_name: string | null;
  lastSignInAt: string | null;
  role: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

async function findUserByEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  email: string,
) {
  const normalizedEmail = email.toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return { error, user: null };
  }

  return {
    error: null,
    user:
      data.users.find(
        (candidate) => candidate.email?.toLowerCase() === normalizedEmail,
      ) ?? null,
  };
}

async function getAuthUsersById(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
) {
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return new Map<string, { email: string | null; emailConfirmedAt: string | null; lastSignInAt: string | null }>();
  }

  return new Map(
    data.users.map((authUser) => [
      authUser.id,
      {
        email: authUser.email ?? null,
        emailConfirmedAt: authUser.email_confirmed_at ?? null,
        lastSignInAt: authUser.last_sign_in_at ?? null,
      },
    ]),
  );
}

async function setTechnicianActive(formData: FormData) {
  "use server";

  const memberId = String(formData.get("member_id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile?.company_id || profile.active === false || profile.role !== "owner") {
    redirect("/dashboard");
  }

  if (!memberId || memberId === user.id) {
    redirect("/team?message=You cannot change that team member.");
  }

  const admin = createAdminClient();

  if (!admin) {
    redirect(
      "/team?message=Add SUPABASE_SERVICE_ROLE_KEY to .env.local to manage technicians.",
    );
  }

  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("active, company_id, full_name, role")
    .eq("id", memberId)
    .single<Profile>();

  if (
    targetError ||
    target?.company_id !== profile.company_id ||
    target.role !== "technician"
  ) {
    redirect("/team?message=Only technicians in your company can be changed.");
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ active })
    .eq("id", memberId)
    .eq("company_id", profile.company_id)
    .eq("role", "technician");

  if (updateError) {
    redirect(`/team?message=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/team");
  redirect(`/team?message=Technician ${active ? "reactivated" : "deactivated"}.`);
}

async function inviteTechnician(formData: FormData) {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active, company_id, role")
    .eq("id", user.id)
    .single<Profile>();

  if (
    !profile?.company_id ||
    profile.active === false ||
    (profile.role !== "owner" && profile.role !== "manager")
  ) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();

  if (!admin) {
    redirect(
      "/team?message=Add SUPABASE_SERVICE_ROLE_KEY to .env.local to send invites.",
    );
  }

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const requestHeaders = await headers();
  const origin = getSiteUrl(requestHeaders.get("origin"));

  const inviteMetadata = {
    company_id: profile.company_id,
    full_name: fullName,
    role: "technician",
  };

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: inviteMetadata,
    redirectTo: origin,
  });

  let invitedUserId = data.user?.id ?? null;
  let sentExistingUserSetupLink = false;

  if (error?.message.toLowerCase().includes("already been registered")) {
    const { error: listError, user: existingUser } = await findUserByEmail(
      admin,
      email,
    );

    if (listError || !existingUser) {
      redirect(
        `/team?message=${encodeURIComponent(
          listError?.message ?? "User exists, but could not find their Auth record.",
        )}`,
      );
    }

    invitedUserId = existingUser.id;

    const { error: metadataError } = await admin.auth.admin.updateUserById(
      existingUser.id,
      {
        user_metadata: {
          ...existingUser.user_metadata,
          ...inviteMetadata,
        },
      },
    );

    if (metadataError) {
      redirect(`/team?message=${encodeURIComponent(metadataError.message)}`);
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: origin,
      },
    );

    if (resetError) {
      redirect(`/team?message=${encodeURIComponent(resetError.message)}`);
    }

    sentExistingUserSetupLink = true;
  } else if (error || !data.user) {
    redirect(
      `/team?message=${encodeURIComponent(error?.message ?? "Invite failed.")}`,
    );
  }

  if (!invitedUserId) {
    redirect("/team?message=Invite failed.");
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      active: true,
      company_id: profile.company_id,
      full_name: fullName || null,
      id: invitedUserId,
      role: "technician",
    },
    { onConflict: "id" },
  );

  if (profileError) {
    const message = profileError.message.includes("permission denied")
      ? "Invite email sent, but Supabase needs table grants for public.profiles before the profile can be created."
      : `Invite email sent, but profile setup needs attention: ${profileError.message}`;

    redirect(
      `/team?message=${encodeURIComponent(message)}`,
    );
  }

  revalidatePath("/team");

  if (sentExistingUserSetupLink) {
    redirect("/team?message=User already existed, so a password setup link was sent.");
  }

  redirect("/team?message=Technician invite sent.");
}

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const { message } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active, company_id, full_name, role, companies(name)")
    .eq("id", user.id)
    .single<Profile>();

  if (
    profileError ||
    !profile?.company_id ||
    profile.active === false ||
    (profile.role !== "owner" && profile.role !== "manager")
  ) {
    redirect("/dashboard");
  }

  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("active, id, full_name, role")
    .eq("company_id", profile.company_id)
    .order("role", { ascending: true })
    .order("full_name", { ascending: true })
    .returns<Array<Omit<TeamMember, "email" | "emailConfirmedAt" | "lastSignInAt">>>();

  const admin = createAdminClient();
  const authUsersById = admin ? await getAuthUsersById(admin) : new Map();
  const enrichedTeamMembers: TeamMember[] =
    teamMembers?.map((member) => {
      const authUser = authUsersById.get(member.id);

      return {
        ...member,
        email: authUser?.email ?? null,
        emailConfirmedAt: authUser?.emailConfirmedAt ?? null,
        lastSignInAt: authUser?.lastSignInAt ?? null,
      };
    }) ?? [];
  const canChangeTechnicians = profile.role === "owner";

  return (
    <AppShell
        active="team"
        companyName={profile.companies?.name ?? "ShireProof"}
        description="Invite technicians, monitor access, and keep inactive accounts out of the workflow."
        eyebrow="Team"
        role={profile.role}
        tone="team"
        title="Team management"
        userName={profile.full_name ?? user.email ?? "User"}
      >

      <section className={`${sectionClass} max-w-5xl lg:grid lg:grid-cols-[1fr_360px] lg:gap-6`}>
        <Card className="overflow-hidden border-t-4 border-t-rose-500">
          <CardHeader eyebrow="People" title="Current team" />
          <div className="grid gap-3 p-5">
            {enrichedTeamMembers.length > 0 ? (
              enrichedTeamMembers.map((member) => (
                <div
                  className={`${softPanelClass} grid gap-4 p-4 sm:grid-cols-[1fr_auto]`}
                  key={member.id}
                >
                  <div className="min-w-0">
                    <h3 className="font-black">
                      {member.full_name ?? "Unnamed user"}
                    </h3>
                    <p className="mt-1 truncate text-sm font-bold text-slate-500">
                      {member.email ?? "Email unavailable"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill status={member.role} />
                      {member.active === false ? (
                        <StatusPill status="deactivated" />
                      ) : (
                        <StatusPill
                          status={member.emailConfirmedAt ? "active" : "invite_pending"}
                        />
                      )}
                      {member.lastSignInAt ? (
                        <span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-slate-500">
                          Last sign-in {formatDate(member.lastSignInAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {canChangeTechnicians && member.role === "technician" ? (
                    <form action={setTechnicianActive}>
                      <input name="member_id" type="hidden" value={member.id} />
                      <input
                        name="active"
                        type="hidden"
                        value={member.active === false ? "true" : "false"}
                      />
                      <button
                        className={`min-h-10 rounded-lg border bg-white px-3 text-sm font-black transition ${
                          member.active === false
                            ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            : "border-red-200 text-red-700 hover:bg-red-50"
                        }`}
                        type="submit"
                      >
                        {member.active === false ? "Reactivate" : "Deactivate"}
                      </button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <div className={`${softPanelClass} p-6 text-center`}>
                <h3 className="text-lg font-black">No team members yet</h3>
              </div>
            )}
          </div>
        </Card>

        <Card className="mt-6 h-fit overflow-hidden border-t-4 border-t-teal-700 lg:mt-0">
          <CardHeader eyebrow="Access" title="Invite technician" />
          <form action={inviteTechnician} className="grid gap-4 p-5">
            <label className="grid gap-2 font-bold">
              Full name
              <input
                className={inputClass}
                name="full_name"
                placeholder="Alex Fielding"
              />
            </label>
            <label className="grid gap-2 font-bold">
              Email
              <input
                className={inputClass}
                name="email"
                placeholder="alex@example.com"
                required
                type="email"
              />
            </label>
            <button
              className={primaryButtonClass}
              type="submit"
            >
              Send invite
            </button>
          </form>

          {message ? (
            <p className="mx-5 mb-5 rounded-lg bg-cyan-50 p-3 text-sm font-bold text-cyan-900">
              {message}
            </p>
          ) : null}
        </Card>
      </section>
    </AppShell>
  );
}

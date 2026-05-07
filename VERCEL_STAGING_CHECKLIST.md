# Vercel Private Staging Checklist

Use this when moving ShireProof from localhost to a private Vercel staging site.

## Recommendation

Vercel is the best first staging host for ShireProof because the app is Next.js,
the build command already works with `next build`, and Preview deployments make
it easy to test on phones without treating the app as fully launched.

## Before Importing

- Push only the `ShireProof` app folder to GitHub, or set Vercel's root directory
  to `ShireProof` if the repository contains both `ShireProof` and `ShireWeb`.
- Confirm `.env.local` is not committed.
- Keep staging private by using Vercel's generated URL first. Do not point a real
  customer-facing domain at it until the workflow is tested.

## Vercel Project Settings

Framework preset:

```text
Next.js
```

Root Directory:

```text
ShireProof
```

Build Command:

```text
npm run build
```

Install Command:

```text
npm install
```

Output Directory:

```text
leave blank
```

## Environment Variables

Add these in Vercel Project -> Settings -> Environment Variables.

For private staging, add them to Preview. If you later promote this to production,
copy the same keys to Production with the production site URL.

```text
NEXT_PUBLIC_SUPABASE_URL=your Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your Supabase publishable anon key
NEXT_PUBLIC_SITE_URL=https://your-staging-domain.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your Supabase service role key
```

Important:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are safe
  to expose in browser code.
- `SUPABASE_SERVICE_ROLE_KEY` is secret. Put it only in Vercel environment
  variables and never commit it.
- `NEXT_PUBLIC_SITE_URL` should match the exact staging URL you want invite and
  password emails to use.

## Supabase Auth Settings

Go to Supabase Dashboard -> Authentication -> URL Configuration.

For staging:

```text
Site URL:
https://your-staging-domain.vercel.app

Redirect URLs:
https://your-staging-domain.vercel.app/**
https://*-your-vercel-account.vercel.app/**
http://localhost:3000/**
```

For email templates, use `{{ .RedirectTo }}` in invite and recovery links. See
`SUPABASE_EMAIL_TEMPLATES.md`.

## Supabase SMTP

Keep custom SMTP enabled if Resend is already verified.

Recommended staging sender:

```text
noreply@mail.shiresales.ca
ShireProof
```

## Post-Deploy Smoke Test

Run this exact test on the Vercel URL:

1. Open `/login`.
2. Sign in as owner.
3. Open Dashboard.
4. Open Jobs.
5. Create a test job.
6. Assign a technician.
7. Invite a new test technician email.
8. Open invite email and set password.
9. Sign in as technician on phone.
10. Open assigned job.
11. Start a report.
12. Save draft.
13. Upload a photo.
14. Submit report.
15. Sign in as owner.
16. Review the report.
17. Return to draft with note.
18. Submit again as technician.
19. Mark reviewed as owner.
20. Confirm reviewed report cannot be edited.
21. Open print/PDF page.

## Known Staging Limitations

- This is not production-ready until RLS policies, backups, and the final domain
  are reviewed.
- Vercel Preview URLs can change. Use `NEXT_PUBLIC_SITE_URL` to force email
  links to the staging URL you want users to test.
- If invites redirect to localhost, Supabase URL Configuration or
  `NEXT_PUBLIC_SITE_URL` is wrong.

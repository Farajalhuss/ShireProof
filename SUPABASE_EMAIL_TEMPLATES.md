# Supabase Email Templates

Use these in Supabase Dashboard -> Authentication -> Emails -> Templates.

Important: ShireProof passes the base app URL as `redirectTo`, such as
`https://shireprooflaunch.vercel.app`. The templates below append
`/auth/confirm` themselves.

## Invite User

Subject:

```text
You've been invited to ShireProof
```

Body:

```html
<h2>You've been invited to ShireProof</h2>

<p>Your manager has invited you to join your company's ShireProof workspace.</p>

<p>Click the button below to create your password and start submitting field reports.</p>

<p>
  <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/accept-invite">Create your password</a>
</p>

<p>If you were not expecting this invitation, you can ignore this email.</p>
```

## Reset Password

Subject:

```text
Set or reset your ShireProof password
```

Body:

```html
<h2>Set or reset your ShireProof password</h2>

<p>Use the button below to create a new password for your ShireProof account.</p>

<p>
  <a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/accept-invite">Set password</a>
</p>

<p>If you did not request this email, you can ignore it.</p>
```

## SMTP Settings

Use these values after the Resend domain is verified:

```text
Sender email address: noreply@mail.shiresales.ca
Sender name: ShireProof
Host: smtp.resend.com
Port number: 465
Minimum interval per user: 60
Username: resend
Password: your Resend API key
```

## URL Configuration

For local testing:

```text
Site URL: http://localhost:3000
Redirect URLs:
http://localhost:3000/**
```

For private Vercel staging:

```text
Site URL: https://your-staging-domain.vercel.app
Redirect URLs:
https://your-staging-domain.vercel.app/**
https://*-your-vercel-account.vercel.app/**
http://localhost:3000/**
```

For production later:

```text
Site URL: https://proof.shiresales.ca
Redirect URLs:
https://proof.shiresales.ca/**
https://your-staging-domain.vercel.app/**
http://localhost:3000/**
```

# Supabase Migrations

Run these in Supabase Dashboard -> SQL Editor.

## Active Profiles

Adds reversible technician deactivation.

```sql
alter table public.profiles
add column if not exists active boolean not null default true;

update public.profiles
set active = true
where active is null;

grant usage on schema public to service_role;
grant all on table public.profiles to service_role;
```

After running this, ShireProof can:

- Deactivate a technician by setting `profiles.active = false`.
- Reactivate a technician by setting `profiles.active = true`.
- Keep historical report ownership intact.
- Block inactive users from protected app pages.

## Report Return Notes

Adds manager/owner review notes when a submitted report is returned to a technician.

```sql
alter table public.reports
add column if not exists returned_at timestamptz,
add column if not exists returned_by uuid references public.profiles(id),
add column if not exists return_note text;

grant all on table public.reports to service_role;
```

If Supabase asks for a named foreign key relationship in the app, make sure the
`returned_by` foreign key exists. The app reads it as `reports_returned_by_fkey`.

## Jobs MVP

Adds the fields ShireProof needs for job records and report linking.

```sql
alter table public.jobs
add column if not exists title text,
add column if not exists job_number text,
add column if not exists description text,
add column if not exists due_date date,
add column if not exists created_by uuid references public.profiles(id),
add column if not exists completed_at timestamptz;

alter table public.reports
add column if not exists job_id uuid references public.jobs(id);

grant all on table public.jobs to service_role;
grant all on table public.reports to service_role;
```

After any old unlinked reports are either linked to jobs or intentionally
removed, enforce job-backed reports:

```sql
alter table public.reports
alter column job_id set not null;
```

Recommended checks after running the SQL:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'jobs'
  and column_name in (
    'id',
    'company_id',
    'title',
    'job_number',
    'customer_name',
    'site_name',
    'site_address',
    'assigned_to',
    'status',
    'description',
    'due_date',
    'created_by'
  )
order by column_name;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reports'
  and column_name = 'job_id';
```

## Multiple Technicians Per Job

Adds a join table so a job can be assigned to more than one technician.

```sql
create table if not exists public.job_assignments (
  job_id uuid not null references public.jobs(id) on delete cascade,
  technician_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles(id),
  primary key (job_id, technician_id)
);

insert into public.job_assignments (job_id, technician_id)
select id, assigned_to
from public.jobs
where assigned_to is not null
on conflict (job_id, technician_id) do nothing;

grant all on table public.job_assignments to service_role;
```

Recommended check:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'job_assignments';

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'job_assignments'
order by column_name;
```

## Job Status Lifecycle

The app uses these `jobs.status` values:

- `open`
- `in_progress`
- `completed`
- `cancelled`

If your `jobs.status` column has a restrictive check constraint, update it to
allow those values. The exact constraint name can vary, so check it first:

```sql
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.jobs'::regclass
  and contype = 'c';
```

Then drop and recreate the status check only if needed:

```sql
alter table public.jobs
drop constraint if exists jobs_status_check;

alter table public.jobs
add constraint jobs_status_check
check (status in ('open', 'in_progress', 'completed', 'cancelled'));
```

## Report Activity History

Adds a report timeline for proof-record events like draft creation, submission,
review, returns, and photo uploads.

```sql
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_company_id_idx
on public.activity_events(company_id);

create index if not exists activity_events_report_id_created_at_idx
on public.activity_events(report_id, created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists "Company members can read activity events"
on public.activity_events;

create policy "Company members can read activity events"
on public.activity_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.company_id = activity_events.company_id
      and coalesce(p.active, true)
  )
);

drop policy if exists "Company members can insert activity events"
on public.activity_events;

create policy "Company members can insert activity events"
on public.activity_events
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.company_id = activity_events.company_id
      and coalesce(p.active, true)
  )
);

grant select, insert on table public.activity_events to authenticated;
grant all on table public.activity_events to service_role;
```

Recommended check:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'activity_events'
order by column_name;
```

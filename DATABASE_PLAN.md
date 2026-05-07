# ShireProof Database Plan

The first database foundation is intentionally simple and multi-tenant.

## Core Tables

- companies: customer businesses using ShireProof.
- profiles: users connected to Supabase Auth.
- jobs: work records assigned to technicians.
- report_templates: reusable forms for trades and job types.
- reports: technician submissions.
- report_photos: metadata for uploaded job photos.

## Multi-Tenancy Rule

Most records include `company_id`.

The app should only show data where the record company matches the logged-in user's profile company.

## Flexible Forms

Template-specific answers start in `reports.form_data` as JSON.

This lets the MVP support general, HVAC, electrical, construction, and security camera templates without creating a separate table for every trade too early.

## Storage Rule

Report photos should be uploaded to the private `report-photos` bucket with paths shaped like:

```text
company_id/report_id/file-name.jpg
```

Storage policies use the first folder name to keep company photo access separated.

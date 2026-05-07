# ShireProof UI/UX Direction

This app should feel like field-service operations software, not a generic card dashboard.

## Product Layout

- Use a persistent app shell for authenticated pages.
- Desktop uses a left navigation rail for Dashboard, Jobs, Team, and future core areas.
- Mobile uses a compact top bar and bottom navigation for quick technician access.
- Login, invite acceptance, and customer print/PDF pages stay standalone.
- Avoid growing every page by adding more cards to the same canvas. Split workflows into pages when the user intent changes.

## Role Experience

- Owner and manager views should feel like a command center: review queue, active jobs, team visibility, exceptions, and workflow controls.
- Technician views should feel like a task list: assigned jobs, drafts, returned reports, and fast report submission.
- Admin and destructive actions should be visually separated from daily work.

## Page Identity

- Dashboard: operational command center.
- Jobs: dispatch board and work tickets.
- Job detail: work order.
- Report detail: proof/inspection record.
- Report history: timeline.
- Print/PDF: calm customer-facing document, not an internal app screen.

## Color System

- Neutral surfaces should carry most of the UI.
- Deep teal is the primary action and brand color.
- Dark blue-black is the shell/navigation color.
- Amber is for jobs, dispatch, and caution.
- Emerald/blue is for reports, proof, and review.
- Rose/plum is for team/access management.
- Red is only for destructive or serious error states.
- Do not use color alone to communicate meaning; pair it with labels, placement, or status text.
- Normal text should meet WCAG AA contrast, targeting at least 4.5:1. Large text and meaningful UI boundaries should meet at least 3:1.

## Design System Rules

- Prefer named design roles and tokens over random hex colors.
- Keep buttons compact and predictable.
- Use primary buttons only for the main forward action on a screen.
- Keep delete controls collapsed and clearly separate.
- Avoid giant page banners once the shell provides navigation context.
- Forms should be arranged around field-service intent, not just database columns.

## Near-Term UI Roadmap

1. Finish the shell migration and remove duplicate page navigation.
2. Move colors into reusable role-based tokens.
3. Refine mobile technician flows for one-handed use.
4. Create a Reports index only when owners need cross-job report search/filtering.
5. Add Settings later for company, SMTP/email, templates, and billing/admin setup.

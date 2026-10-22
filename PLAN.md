# CarPool – personal vehicle manager

A web app for people with a few private vehicles (not a commercial fleet tool):

- list vehicles with basic data, pre-filled from the Czech vehicle registry where possible
- track insurance policies and remind before renewal
- track service / maintenance (time- and mileage-based) and remind before it is due

## Project stages

### Stage 0 – Clickable prototype (this repo, now)
Vite + React + TypeScript, no backend. Data lives in `localStorage`, seeded with demo data.
Purpose: iterate quickly on flows and look & feel.

- Persistence is behind `Repository` (`src/data/repository.ts`) – only `LocalRepository` exists.
- Registry lookup is behind `VehicleRegistry` (`src/data/registry.ts`) – only a mock exists.
- Reminder logic is pure and lives in `src/domain/reminders.ts` (works on a `Db` snapshot).
- Design tokens are at the top of `src/index.css`.
- Reminders are shown **in-app only**; nothing is actually sent.

**Exit criteria:** you are happy with the main screens and the data model (fields on vehicle / policy / service task).

### Stage 1 – Real data & login (Supabase)
- Supabase project, Postgres schema mirroring `src/domain/types.ts` (`vehicles`, `policies`, `service_tasks`, `service_records`), each with `user_id`.
- Row Level Security: every row only visible to its owner.
- Auth: email magic link first (no passwords to manage); Google/Apple later if wanted.
- `SupabaseRepository` implementing `Repository`; one-time import of prototype `localStorage` data.
- Deploy the static app (Cloudflare Pages / Vercel / Netlify) + environment config.

### Stage 2 – Real reminders
- Notification preferences per user (email first; web push / Telegram later).
- Scheduled job (Supabase `pg_cron` + Edge Function) that evaluates reminders daily and sends them; a `notifications_sent` table avoids duplicates.
- Reminder text in Czech/English, link back to the vehicle.
- Optional: iCal feed so due dates show up in the phone calendar.

### Stage 3 – Czech registry integration
**Open question – see "Risks".** Goal: enter SPZ or VIN → fill make, model, year, fuel, power, colour, and later STK validity.
- Call the registry from a Supabase Edge Function (credentials never reach the browser).
- Cache results per VIN.
- Fall back to manual entry whenever lookup fails.

### Stage 4 – Everyday polish
- Installable PWA, works well on the phone, quick "update odometer" action.
- Czech UI (i18n), CZK / km formatting already in place.
- Attach documents (policy PDF, service invoices) via Supabase Storage.
- Cost overview per vehicle / per year.

### Later ideas
Share a vehicle with a family member; fuel log; tyre set tracking; STK/emissions auto-reminder from registry data; import from CSV; selling checklist / export of service history.

## Risks and open questions

1. **Registry access.** `dataovozidlech.cz` appears to offer aggregate open data ("Datová kostka") and owner access via the Portál dopravy; a public per-vehicle (VIN/SPZ → data) API was **not** found in a first look. Options to check: official request for data from the Road Vehicle Register (via the Ministry of Transport / Digital and Information Agency), owner-authorised access, or a CSV/open-data based local lookup. The app must stay fully usable with manual entry.
2. **Reminders need a backend** – a pure frontend cannot reliably notify you when the app is closed; this is what Stage 2 solves.
3. **Data model** – the prototype assumes: the odometer is not stored on the vehicle – the latest reading is derived from service entries (`src/domain/odometer.ts`) – service tasks with time and/or km intervals, policies with a single renewal date. Multi-driver, leasing and per-policy documents are not modelled yet.

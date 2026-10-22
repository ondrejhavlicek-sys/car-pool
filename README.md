# CarPool

Personal vehicle manager – see [PLAN.md](PLAN.md) for goals and project stages.

## Run the prototype

```bash
npm install
npm run dev
```

Open http://localhost:5173. Data is stored in your browser's `localStorage`; use "reset demo data" in the footer to start over.

Other scripts: `npm run build`, `npm run lint`.

## Structure

```
src/domain/   types, date helpers, reminder rules (pure, no React)
src/data/     Repository (localStorage now, Supabase later), registry lookup (mock), seed data
src/pages/    Overview, Vehicles list, Vehicle form, Vehicle detail (overview / insurance / service)
src/ui/       shared components
```

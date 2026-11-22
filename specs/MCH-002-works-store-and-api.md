---
id: MCH-002
title: Works and occurrences store, and API
status: backlog
impacts: [backend, db]
who: [pentchomakov]
source: human
branch:
deps: [MCH-001, MCH-010]
created: 2026-11-22
paths: []
---

## Summary
Create the backend foundation: a Hono API over SQLite, modelling a **work** (the film, play, artist or exhibition) separately from its **occurrences** (each showtime or performance, with its date, venue and price). Runs locally now and is designed to move to Cloudflare Workers + D1 later.

## Requirements
- `server/` directory with a Hono app, started by `npm run dev:api`; the Vite dev server proxies `/api` to it.
- Plain SQL migrations in `server/migrations/`:
  - `works`: id, title, original_title, original_language, kind, category, creator_name, description, thumbnail_url, dedupe_key (unique), first_seen_at, last_seen_at.
  - `occurrences`: id, work_id, venue_id (nullable), location_text, starts_at (UTC), ends_at, cost_text, cost_min_cad, listing_url, source_url (the page the date was read from), source_kind (venue | aggregator | web-search), dedupe_key (unique: work + venue + starts_at), first_seen_at, last_seen_at.
  - `venues`: id, name, address, neighbourhood.
  - `scan_runs`: id, kind, started_at, finished_at, status, works_found, occurrences_new, tokens_in, tokens_out, searches, est_cost_usd, error.
- Categories are stored as text and validated against `shared/categories.ts`, a single list imported by both the server and the UI, so the taxonomy can change without a migration. Seed it from MCH-010's recommendation.
- Times are stored in UTC and displayed in `America/Toronto` (Montreal's IANA zone).
- All SQL lives in `server/repo/`. Every repository method is async, because D1 is async.
- `GET /api/works?category=&from=&to=` returns works with at least one upcoming occurrence, each with `next_occurrence` and `occurrence_count`, ordered by next date.
- `GET /api/works/:id` returns a work with all its upcoming occurrences.
- `.env.example` committed; add `*.db`, `*.sqlite` and `*.sqlite-journal` to `.gitignore`.

## Acceptance
- `npm run dev:api` starts the API and applies migrations to an empty database.
- A film with 12 showtimes at 2 cinemas is stored as 1 work and 12 occurrences, and `GET /api/works` returns it once with `occurrence_count: 12` (vitest, in-memory SQLite).
- Upserting the same occurrence twice leaves one row (test).
- Category and date-range filters work, and past occurrences are excluded (tests).
- An unknown category is rejected at the repository layer (test).
- No SQL appears outside `server/repo/`, and every repository method returns a Promise.
- `git status` is clean after a local run (the database file is ignored).

## Notes
- Update this ticket with MCH-010's findings before `/spec-start`; the field list above is a starting point, not final.
- Cloudflare constraints: only SQL that D1 supports, no Node-only APIs in route handlers, no filesystem access outside the driver layer. The deploy itself is a later ticket, and must put the app behind authentication (for example Cloudflare Access) so nobody else can trigger paid enrichment.
- `work_interactions` (save, reject with feedback, attended) is added by MCH-012; taste columns by MCH-011.
- Open question: SQLite driver. `better-sqlite3` is fast but synchronous; `@libsql/client` is async and closer to D1. Decide during `/spec-start`.

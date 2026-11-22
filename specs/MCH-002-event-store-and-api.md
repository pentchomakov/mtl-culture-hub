---
id: MCH-002
title: Event store and API
status: backlog
impacts: [backend, db]
who: [pentchomakov]
source: human
branch:
deps: [MCH-001]
created: 2026-11-22
paths: []
---

## Summary
Create the backend foundation: a Hono API over a SQLite database with a schema for events, venues and scan runs, behind a repository layer. Runs locally now and is designed to move to Cloudflare Workers + D1 later.

## Requirements
- `server/` directory with a Hono app, started by `npm run dev:api`; the Vite dev server proxies `/api` to it.
- SQLite schema (plain SQL migrations in `server/migrations/`): `venues`, `events`, `scan_runs`.
  - `events`: id, title, description, category, start_at, end_at, venue_id (nullable), location_text, cost_text, cost_min, url, thumbnail_url, source (venue-scan | web-scan), dedupe_key (unique), first_seen_at, last_seen_at.
  - `scan_runs`: id, kind, started_at, finished_at, status, events_found, events_new, tokens_in, tokens_out, error.
- All SQL lives in a repository module (`server/repo/`), never inline in route handlers, so the driver can be swapped for D1.
- `GET /api/events?category=&from=&to=` returns upcoming events ordered by `start_at`.
- Categories are a fixed enum: `concert`, `movie`, `music`, `theater`, `other`.
- Config via environment variables; `.env` is gitignored and `.env.example` is committed.

## Acceptance
- `npm run dev:api` starts the API and applies migrations to an empty database.
- `GET /api/events` returns `[]` on an empty database and filters correctly by category and date range (covered by vitest tests against an in-memory SQLite).
- Inserting two events with the same `dedupe_key` results in one row (upsert), asserted by a test.
- No SQL appears outside `server/repo/`.

## Notes
- Design constraint, Cloudflare: use only SQL features D1 supports, no Node-only APIs in route handlers, and no filesystem access outside the repo/driver layer. Do not build the deploy here; it will be a later ticket (secrets handling follows the Cloudflare rules in `/spec-ship`).
- Design constraint, preferences: the eventual preference-learning feature needs an `event_interactions` table (viewed, saved, dismissed, attended). Not built here; leave the schema room.
- Open question: SQLite driver. `better-sqlite3` is fast and local; `@libsql/client` is closer to D1. Decide during `/spec-start`.

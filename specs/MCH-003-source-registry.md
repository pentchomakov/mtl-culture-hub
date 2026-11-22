---
id: MCH-003
title: Source registry
status: backlog
impacts: [backend, db]
who: [pentchomakov]
source: human
branch:
deps: [MCH-002]
created: 2026-11-22
paths: []
---

## Summary
A curated, version-controlled list of where to look for Montreal events: individual venues, aggregators that cover many venues on one page, and standing web-search queries for the small and indie events no listing covers.

## Requirements
- `server/data/sources.json` is the source of truth. Each entry has: slug, name, kind (`venue` | `aggregator` | `search`), url (venue and aggregator) or query (search), category hints, language (fr | en | both), notes, enabled.
- `venue` sources link to a `venues` row (name, address, neighbourhood).
- A seed step loads the file into a `sources` table (idempotent upsert by slug), run on API start and by `npm run seed:sources`.
- Seed 10 to 15 entries from MCH-010's findings: a mix of venues (cinemas, theatres, concert halls), aggregators, university music-faculty calendars, and a few search queries (for example free outdoor concerts this week). Search entries are consumed by MCH-005.
- The repository exposes `listEnabledSources(kind)`; scanners skip disabled entries.
- `GET /api/sources` lists them.

## Acceptance
- Running the seed twice yields the same row count.
- `GET /api/sources` returns every entry in `sources.json`.
- A test fails if two entries share a slug, a venue or aggregator lacks a URL, or a search entry lacks a query.
- A disabled source is not returned by `listEnabledSources` (test).
- Every seeded URL returned a successful response when checked (record the check date in Notes).

## Notes
- Adding a source is a one-line JSON edit plus a commit; no UI for editing sources in this ticket.
- Aggregators to evaluate in MCH-010 include La Vitrine and the Quartier des spectacles calendar; keep only those the spike shows are reliable.

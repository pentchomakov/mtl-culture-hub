---
id: MCH-003
title: Curated venue registry
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
A curated, version-controlled list of Montreal venues the scanner checks one by one: movie theatres, theatres, concert halls and small or indie spaces.

## Requirements
- `server/data/venues.json` is the source of truth: name, slug, category hint (movie/theater/concert/music/other), listings URL, optional notes on how the page is structured.
- A seed step loads the file into the `venues` table (idempotent upsert by slug), run on API start and by `npm run seed:venues`.
- Seed about 10 starter venues across categories, for example Cinema du Parc, Cinematheque quebecoise, Quartier des spectacles venues, Theatre du Nouveau Monde, Place des Arts, university music departments. Verify each URL resolves before committing it.
- `GET /api/venues` lists them.

## Acceptance
- Running the seed twice yields the same row count.
- `GET /api/venues` returns every entry in `venues.json`.
- A test fails if two entries share a slug or an entry lacks a URL.
- Every seeded URL returned a successful response when checked (record the check date in Notes).

## Notes
- Adding a venue is a one-line JSON edit plus a commit; no UI for editing venues in this ticket.
- Open question: which venues matter most to you. Starter list is a guess; edit it freely.

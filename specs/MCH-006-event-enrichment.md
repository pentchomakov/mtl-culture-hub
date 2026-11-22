---
id: MCH-006
title: Event enrichment
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
For each event, generate the material that helps you prepare: why you should go, background on the work, the author or artist, and links to their other work, plus a thumbnail.

## Requirements
- Add enrichment columns/table (migration): `why_go`, `background`, `author_name`, `author_bio`, `other_works` (JSON list of title + URL), `enriched_at`.
- `server/enrich/enrich-event.ts`: given an event, call the Claude API (with web search where needed) to produce the fields above from a typed schema; validate before saving.
- Thumbnail: take the event page's `og:image` when available, otherwise leave null.
- `POST /api/events/:id/enrich` enriches one event on demand; an `enrichPending()` function enriches events lacking `enriched_at`, with a per-run cap.
- Enrichment never overwrites scanner-owned fields (title, dates, cost).
- Statements about the author or work must come from sources found in the search, with source URLs stored in `other_works` or a `sources` field; no uncited biography.

## Acceptance
- With the Claude client mocked, enriching an event populates all enrichment fields and sets `enriched_at` (vitest).
- Re-enriching does not change `title`, `start_at` or `cost_text` (test).
- Invalid model output leaves the event unenriched and records the error rather than saving partial data.
- `enrichPending()` respects its cap (test).
- Manual check on three real events: background is accurate and links resolve (record in Notes).

## Notes
- This is the pre-read feature. Accuracy matters more than volume, so prefer an empty field over an invented one.
- Open question: enrich eagerly after every scan or lazily when you open an event. Cost favors lazy; speed favors eager.

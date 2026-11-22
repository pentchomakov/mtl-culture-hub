---
id: MCH-006
title: Pre-read enrichment per work
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
The pre-read: background on the work, the creator or artist, and links to their other work, so you arrive prepared. Generated once per **work**, never per occurrence, and only from sources the model actually found.

## Requirements
- Migration adding enrichment fields for works: `background`, `creator_bio`, `other_works` (JSON list of title + URL), `sources` (JSON list of URLs), `enriched_at`, `enrich_error`.
- `server/enrich/enrich-work.ts`: call the Claude API with `web_search` and `web_fetch` and return the fields above from a typed schema; validate before saving.
- Every section must list the source URLs it was based on, stored in `sources`. (The API's citations feature cannot be combined with structured outputs, so the URLs are schema fields.)
- When no reliable source is found, leave the fields empty and set a "no reliable background found" state, rather than writing unsourced text.
- On demand: `POST /api/works/:id/enrich`. Also `enrichPending({ onlySaved, cap })` to enrich saved works (MCH-012) in bulk.
- Enrichment never overwrites scanner-owned fields (title, dates, cost, thumbnail).

## Acceptance
- With the Claude client mocked, enriching a work populates every field and sets `enriched_at` (vitest).
- Re-enriching does not change scanner-owned fields (test).
- Invalid model output leaves the work unenriched and records `enrich_error`, with no partial save.
- Output with a background but an empty `sources` list is rejected (test).
- `enrichPending` respects its cap and the `onlySaved` filter (test).
- Manual check on three real works: the background is accurate and every link resolves (record in Notes).

## Notes
- This is the differentiating feature, so accuracy matters more than volume.
- Lazy by default: the card's one-line why-go comes from extraction (MCH-011), so the deep pre-read only runs when you open or save a work.
- Cost lever to evaluate: the Batch API (half price) for `enrichPending`, if the server tools are supported there.

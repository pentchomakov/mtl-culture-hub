---
id: MCH-004
title: Page scanner for venues and aggregators
status: backlog
impacts: [backend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-002, MCH-003]
created: 2026-11-22
paths: []
---

## Summary
For each enabled venue and aggregator source, have Claude fetch the listings page and extract works and occurrences into the store. This ticket also owns the shared extraction module that MCH-005 and MCH-011 build on.

## Requirements
- `server/scan/page-scan.ts`: for each enabled venue or aggregator source, call the Claude API with the server-side `web_fetch` tool on the source URL (the URL is included in the prompt; `allowed_domains` restricted to the source's domain). No hand-written HTML fetching or parsing.
- `server/scan/extract.ts` (shared): the typed output schema for works and occurrences, validation (for example zod), dedupe-key normalization, and upsert through the repository layer. Use structured outputs or a strict tool for the typed result; confirm it combines with `web_fetch` during implementation.
- Dates come only from the fetched page, and every occurrence stores its `source_url`.
- Bilingual handling: keep the original title and language; write descriptions in English (default, confirm).
- Capture `thumbnail_url` from the page (for example its `og:image`) when present.
- Follow at most N "next page" links per source (configurable).
- One failing source never aborts the others. Fetch failures (for example JavaScript-rendered pages that return no listings) are recorded separately from extraction failures.
- Write a `scan_runs` row with counts, tokens, server-tool usage and estimated cost.
- Model id and API key come from environment variables, never hardcoded or committed. Handle `stop_reason: "refusal"` without crashing.
- Golden set: `server/scan/__golden__/` holds saved pages from MCH-010 with hand-checked expected works and occurrences. `npm run eval:extract` feeds the saved content straight to the extraction step (no fetch) using the real API and reports precision and recall. It is not part of CI because it costs money.

## Acceptance
- With the Claude client mocked, a fixture response produces the expected works and occurrences in the database (vitest).
- Re-running the same scan inserts zero new rows.
- A failing source is logged, the others still complete, and the run status reflects partial failure.
- Malformed output for one item does not drop the other items from that page.
- Every stored occurrence has a `source_url` (test).
- `npm run eval:extract` runs and reports precision and recall; the baseline is recorded in Notes.
- A real run against at least three sources, including one aggregator, produces plausible results (manual check, record in Notes).

## Notes
- Re-run `eval:extract` whenever the prompt or the model changes, and record the score here.
- Model choice per step is decided with MCH-010's measured cost and accuracy numbers.
- `web_fetch` is billed by tokens only; there is no per-fetch fee.
- Respect each site's terms and robots.txt; fetch listings pages only, at low frequency.

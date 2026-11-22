---
id: MCH-005
title: General web scan for discovery
status: backlog
impacts: [backend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-002, MCH-003, MCH-004]
created: 2026-11-22
paths: []
---

## Summary
A broad sweep for Montreal cultural events that no registered source lists, such as a university jazz band playing in a park. Web search finds candidates; a fetched page confirms them. Nothing is stored on the strength of a search snippet alone.

## Requirements
- `server/scan/web-scan.ts`: run the registry's `search` sources plus per-category prompts for the scan window (default: next 30 days) through Claude with the `web_search` tool, with `max_uses` capped and `user_location` set to Montreal.
- Search results are candidates only. Each candidate URL is then fetched (`web_fetch`) and extracted through the shared `server/scan/extract.ts` from MCH-004.
- A candidate whose date cannot be read from the fetched page is dropped and counted. An occurrence outside the scan window (for example last year's edition) is dropped and counted.
- Rows are marked `source_kind = web-search`. When a page-scan source has the same occurrence, keep one row and prefer the page-scan data.
- Configurable caps on searches and candidates per run, to bound cost.
- Record a `scan_runs` row with counts, searches, tokens and estimated cost.

## Acceptance
- With the Claude client mocked, a fixture candidate yields rows tagged `web-search` (vitest).
- A candidate whose fetched page has no readable date is not stored and is counted (test).
- An occurrence dated last year is dropped (test).
- An occurrence found by both scanners results in one row with the page-scan fields kept (test).
- The search and candidate caps are honored (test).
- A real run finds events not covered by the registry, and 10 spot-checked web-search occurrences have correct dates (manual, record in Notes).

## Notes
- No quality filtering here: capture broadly. Ranking is MCH-011.
- Web search is billed per search on top of tokens, so the caps are the main cost control.

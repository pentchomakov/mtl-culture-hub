---
id: MCH-005
title: General web scan
status: backlog
impacts: [backend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-002]
created: 2026-11-22
paths: []
---

## Summary
A broad sweep for Montreal cultural events that are not on the curated venue list, using the Claude API with web search. This is how small and indie events, like a university jazz band playing in a park, get found.

## Requirements
- `server/scan/web-scan.ts`: a set of search prompts per category and time window (default: next 30 days) that use Claude with the web search tool and return typed events.
- Same output schema, validation, dedupe and upsert path as the venue scanner; share the extraction and persistence code instead of duplicating it.
- Mark rows `source = web-scan`. When the same event is found by both scanners, keep one row and prefer the venue-scan data.
- Record a `scan_runs` row with counts and token usage.
- Cap searches per run (configurable) to bound cost.

## Acceptance
- With the Claude client mocked, a fixture response yields events in the database tagged `web-scan` (vitest).
- An event present from both sources results in one row, with the venue-scan fields retained (test).
- The per-run search cap is honored (test).
- A real run returns at least some events not in the venue registry (manual check, record in Notes).

## Notes
- No quality filtering in this ticket: capture broadly; ranking and preference learning come later.
- Events with an unparseable date are dropped and counted, not guessed.

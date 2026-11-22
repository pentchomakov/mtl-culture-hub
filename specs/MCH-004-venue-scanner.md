---
id: MCH-004
title: Venue scanner
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
For each venue in the registry, fetch its listings page and use the Claude API to extract structured events, then upsert them into the event store.

## Requirements
- `server/scan/venue-scan.ts`: for each venue, fetch the page (timeout, polite user agent, one retry), reduce HTML to readable text, and call the Claude API to return events matching a typed schema (title, description, category, start_at, end_at, cost_text, url, thumbnail_url).
- Validate model output against the schema (e.g. zod); drop and log invalid items rather than failing the run.
- Compute `dedupe_key` (normalized title + date + venue) and upsert via the repository layer.
- One failing venue never aborts the others; each failure is recorded.
- Write a `scan_runs` row with counts, token usage and errors.
- The Claude model id and API key come from environment variables, never hardcoded or committed.

## Acceptance
- With the Claude client and HTTP fetch mocked, a fixture page produces the expected events in the database (vitest).
- Re-running the same scan inserts zero duplicate rows.
- A venue returning HTTP 500 is logged, the other venues still complete, and the run status reflects partial failure.
- Malformed model output for one event does not drop the other events from that page.
- A real run against at least two seeded venues produces plausible events (manual check, record result in Notes).

## Notes
- Respect each site's terms and robots.txt; fetch listings pages only, at low frequency.
- Cost control: log tokens per run so spend is visible (consumed by MCH-007).

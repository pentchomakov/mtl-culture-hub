---
id: MCH-007
title: Scan CLI with run summary
status: backlog
impacts: [backend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-004, MCH-005]
created: 2026-11-22
paths: []
---

## Summary
One command that runs both scanners and tells you what it found and what it cost, so scanning is a repeatable routine rather than a manual script.

## Requirements
- `npm run scan` runs the venue scan then the web scan; flags: `--venues-only`, `--web-only`, `--days N`.
- Prints a summary: events found, new events, per-venue failures, tokens used and estimated cost, duration.
- Exits non-zero only if every scanner failed; partial failure exits 0 with a warning.
- Refuses to run, with a clear message, if the API key is missing.
- Overlapping runs are prevented (a lock or a `scan_runs` running-row check).

## Acceptance
- With both scanners mocked, the summary output matches fixture counts (vitest).
- Running with no API key exits non-zero with an actionable message and makes no network calls.
- Starting a second scan while one is running is refused.
- `--venues-only` does not invoke the web scanner (test).

## Notes
- Scheduling (cron or launchd) is out of scope; the command is the building block for it.

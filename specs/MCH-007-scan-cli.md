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
- `npm run scan` runs the page scan, then the web scan. Flags: `--pages-only`, `--web-only`, `--days N`, `--max-cost USD`.
- `--max-cost` (with a default in `.env`) stops starting new sources once the run's estimated spend reaches it.
- Prints a summary: works and occurrences found, new rows, per-source failures, searches, tokens, estimated cost, duration.
- Exits non-zero only if every scanner failed; partial failure exits 0 with a warning.
- Refuses to run, with a clear message, if the API key is missing.
- Overlapping runs are prevented (a lock or a check for a running `scan_runs` row).

## Acceptance
- With both scanners mocked, the summary output matches fixture counts (vitest).
- Running with no API key exits non-zero with an actionable message and makes no network calls.
- Starting a second scan while one is running is refused.
- `--pages-only` does not invoke the web scanner (test).
- A run whose estimate reaches `--max-cost` starts no further sources and says so in the summary (test).

## Notes
- Scheduling (cron, launchd, or a Cloudflare Cron Trigger later) is out of scope; this command is the building block for it.

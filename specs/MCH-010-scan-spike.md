---
id: MCH-010
title: Scan spike - can we reliably find Montreal events?
status: backlog
impacts: [backend]
who: [pentchomakov]
source: human
branch:
deps: []
created: 2026-11-22
paths: []
---

## Summary
Answer the riskiest question before building infrastructure: can Claude with web search and web fetch reliably find Montreal cultural events, how accurate is the result, and what does a run cost? The deliverable is a report with numbers, and its findings shape MCH-002 to MCH-008.

## Requirements
- A throwaway script in `spikes/scan-spike/` (Node + `@anthropic-ai/sdk`), kept out of `src/` and `server/`. It is not production code and can be deleted once its findings are absorbed.
- Scan a one-week window from about five sources (at least two venues, one aggregator, one university music calendar) plus a general web search across categories.
- Save raw JSON output per source and snapshots of the fetched pages; the snapshots seed MCH-004's golden set.
- Write `docs/spikes/MCH-010-scan-spike.md` covering:
  - events found per source;
  - accuracy from 20 hand-checked events (is it real, right date, right venue, right price);
  - duplicates across sources, including French/English title mismatches;
  - fetch failures, such as JavaScript-rendered pages;
  - tokens, searches and estimated cost per run, for at least two models on the extraction step (for example Claude Opus 5.5 and Claude Haiku 5.5);
  - how found events spread across categories, and how many have runs (several dates) versus one date.
- End the report with recommendations: schema fields for works and occurrences, the category list, the starting source list for MCH-003, the model per step, and the output language.

## Acceptance
- The report exists with every section above, backed by numbers rather than impressions.
- Page snapshots are saved for the golden set.
- Total API spend stays under a budget agreed before starting (recorded in Notes).
- MCH-002 to MCH-008 are updated on `develop` with the recommendations before `/spec-start MCH-002`.

## Notes
- This is "scanner first": the riskiest assumption gets tested before any database or API work.
- Spike code is not held to production standards, but it must pass `npm run lint` or be explicitly excluded from it.
- Budget: to be agreed before starting.

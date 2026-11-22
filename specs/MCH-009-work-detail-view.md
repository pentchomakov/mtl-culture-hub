---
id: MCH-009
title: Work detail view
status: backlog
impacts: [frontend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-006, MCH-008]
created: 2026-11-22
paths: []
---

## Summary
The page behind each card: the pre-read (background, the creator, their other work) and every upcoming date, so you can decide and arrive prepared.

## Requirements
- New page `src/pages/event-detail.tsx` at `/events/:id`, with `CdlPageContainer` as its outermost shell and a breadcrumb back to Events.
- Sections: thumbnail, description, why go with the fit reason (MCH-011, when present), pre-read (background, creator bio, other works, sources), and all upcoming occurrences (date, venue, cost, link to the listing).
- Data from `GET /api/works/:id`; an unknown id shows a not-found state.
- A work without a pre-read shows what exists plus a "Prepare me" action that calls `POST /api/works/:id/enrich` and refreshes. The "no reliable background found" state is shown as such.
- Missing thumbnail falls back to a neutral placeholder.

## Acceptance
- `npm run check:cdl`, `npm run lint`, `npm run build` and `npm test` pass.
- An enriched work renders every section, with sources as links; an unenriched work renders without errors and offers "Prepare me".
- A work with several occurrences lists them all in date order.
- An unknown id shows a not-found state.
- External links use `rel="noopener noreferrer"`.
- Component tests cover enriched, unenriched and multi-occurrence rendering.

## Notes
- Save, "not for me" with feedback, and "went" controls are added here by MCH-012.

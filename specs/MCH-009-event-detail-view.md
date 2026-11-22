---
id: MCH-009
title: Event detail view
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
The page behind each event card: thumbnail, full description, background, the author or artist, and links to their other work, so you arrive prepared.

## Requirements
- New page `src/pages/event-detail.tsx` at `/events/:id`, with `CdlPageContainer` as its outermost shell and a breadcrumb back to Events.
- Sections: thumbnail, description, why go, background (pre-read), author (name and bio), other works (links that open in a new tab), practical details (date, venue, cost, link to the original listing).
- `GET /api/events/:id` added if not already present; 404 handled with a not-found state.
- Events not yet enriched show what exists plus an "Enrich now" action that calls `POST /api/events/:id/enrich` and refreshes.
- Missing thumbnail falls back to a neutral placeholder.

## Acceptance
- `npm run check:cdl`, `npm run lint`, `npm run build` and `npm test` pass.
- An enriched event renders every section; an unenriched event renders without errors and offers "Enrich now".
- An unknown id shows a not-found state.
- External links use `rel="noopener noreferrer"`.
- Component test covers enriched and unenriched rendering.

## Notes
- Depends on MCH-006 for the data and MCH-008 for the navigation entry.
- Out of scope: saving, dismissing or rating events. That is the start of preference learning and gets its own tickets once there is real data.

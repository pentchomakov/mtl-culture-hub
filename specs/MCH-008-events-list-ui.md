---
id: MCH-008
title: Events list UI with category tabs
status: backlog
impacts: [frontend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-002]
created: 2026-11-22
paths: []
---

## Summary
The main screen: upcoming Montreal events with category tabs (All, Concerts, Movies, Music, Theater, Other) and cards showing title, description, why you should go, and cost.

## Requirements
- New page `src/pages/events.tsx` using `CdlPageContainer` as its outermost shell (enforced by `npm run check:cdl`); route registered in `src/App.tsx` and a sidebar entry added in `src/app/sidebar.tsx` with a Phosphor icon.
- Category tabs as page `navLinks`; the as-of stamp (last scan time) in `titleInfo`.
- Event cards use CDL components (`CdlBadge`, `CdlEmptyState`, `CdlSkeleton`); no custom layout wrapper.
- Each card: title, short description, why-go line (a placeholder shown until enrichment exists), cost, date and venue.
- Data from `GET /api/events`; loading, empty and error states handled.
- Clicking a card navigates to `/events/:id` (the destination is built in MCH-009; until then it can be a stub).
- Overview remains the landing page and links onward to Events.

## Acceptance
- `npm run check:cdl`, `npm run lint` and `npm run build` pass.
- Selecting each tab filters events to that category; All shows everything.
- With an empty database the page shows `CdlEmptyState`; with the API down it shows an error state, not a blank page.
- Component test (vitest + testing library) covers tab filtering.
- No hardcoded hex colours; sidebar footer order unchanged.

## Notes
- Open question: your Concerts and Music tabs overlap. Proposed meaning: Concerts = ticketed shows, Music = free or informal (park jazz band). Confirm during `/spec-start`; the backend enum already has both.
- Build against a handful of fixture events so this can proceed before the scanners work.
- Use the `cdl-build` skill so missing components are flagged before code is written.

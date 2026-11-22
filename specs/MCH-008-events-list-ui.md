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
The main screen: upcoming Montreal works by category, one card per work (not per showtime), showing title, a one-line reason to go, cost and when it is on.

## Requirements
- New page `src/pages/events.tsx` using `CdlPageContainer` as its outermost shell (enforced by `npm run check:cdl`); route registered in `src/App.tsx` and a sidebar entry in `src/app/sidebar.tsx` with a Phosphor icon.
- Category tabs as page `navLinks`, generated from `shared/categories.ts` with All first; the as-of stamp (last scan time) in `titleInfo`.
- One card per work: title (and original title when it differs), one-line why-go and fit score when present (MCH-011), cost, next date with "N dates" when there are several, and venue.
- Sort by date by default, with a "Best fit" sort once fit scores exist.
- Built from CDL components (`CdlBadge`, `CdlEmptyState`, `CdlSkeleton`); no custom layout wrapper.
- Data from `GET /api/works`; loading, empty and error states handled.
- Clicking a card navigates to `/events/:id` (built in MCH-009; a stub until then).
- Overview remains the landing page and links onward to Events.

## Acceptance
- `npm run check:cdl`, `npm run lint`, `npm run build` and `npm test` pass.
- Selecting each tab filters to that category; All shows everything.
- A film with 12 showtimes renders as one card reading "12 dates".
- With an empty database the page shows `CdlEmptyState`; with the API down it shows an error state, not a blank page.
- Component test (vitest + Testing Library) covers tab filtering and the multi-date card.
- No hardcoded hex colours; sidebar footer order unchanged.

## Notes
- Categories are settled by MCH-010's report; your starting list was All, Concerts, Movies, Music, Theater, Other. The Concerts/Music overlap needs resolving there.
- Language: English descriptions with the original title kept (default, confirm).
- Save and "not for me" actions on cards are added by MCH-012.
- Use the `cdl-build` skill so missing components are flagged before code is written.

---
id: MCH-012
title: Save, reject with feedback, and attended
status: backlog
impacts: [frontend, backend, db]
who: [pentchomakov]
source: human
branch:
deps: [MCH-002, MCH-008]
created: 2026-11-22
paths: []
---

## Summary
Let you act on a work and say why: save it, reject it with a reason, or mark that you went and whether it was worth it. These signals are what the app later learns from (MCH-013), so they are captured from the first version of the UI.

## Requirements
- Migration adding `work_interactions`: id, work_id, kind (`save` | `reject` | `attended`), reason_code (nullable), reason_text (nullable), rating (nullable, 1 to 5, for attended), created_at.
- Rejecting asks why, in one small dialog (`CdlDialog`), and can be skipped with a single click:
  - quick reasons that separate taste from logistics: `not-my-taste`, `seen-it`, `too-expensive`, `bad-timing`, `too-far`, `other`;
  - an optional free-text box to explain in your own words.
- Attended: an optional rating and note ("was it worth it?"), the strongest signal for learning.
- API: `POST /api/works/:id/interactions` and `DELETE /api/interactions/:id` (undo).
- UI: save and "not for me" on cards (MCH-008); save, "not for me" and "went" on the detail view (MCH-009).
- Rejected works are hidden from the list by default, with a "Show hidden" toggle; a Saved filter shows saved works.

## Acceptance
- Rejecting with a reason code and text persists both (test).
- Rejecting without a reason is allowed and persists with empty reason fields (test).
- Undo removes the interaction and the work reappears in the list.
- Rejected works are hidden by default and visible with the toggle (component test).
- Marking attended with a rating and note persists both (test).
- `npm run check:cdl`, `npm run lint`, `npm run build` and `npm test` pass.

## Notes
- Why separate reason codes: a "bad timing" or "too expensive" rejection says nothing about taste, so learning must not treat it as a dislike.
- Saving a work is a good trigger for its pre-read (MCH-006 `enrichPending({ onlySaved })`).

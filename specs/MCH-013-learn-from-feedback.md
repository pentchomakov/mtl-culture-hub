---
id: MCH-013
title: Learn from feedback - propose taste profile updates
status: backlog
impacts: [backend]
who: [pentchomakov]
source: human
branch:
deps: [MCH-011, MCH-012]
created: 2026-11-22
paths: []
---

## Summary
Turn your saves, rejections, reasons and post-event ratings into proposed edits to your taste profile, which you approve. The app's "learning" stays a readable file you control, not a hidden model.

## Requirements
- `npm run learn` reads interactions since the last accepted proposal and asks Claude to propose a diff to the taste profile, with a reason for each change that cites the interactions behind it (by id).
- The proposal is written to `config/taste.proposed.md` and printed as a diff. Nothing changes the real profile until you accept it (`npm run learn -- --accept`) or edit it yourself.
- Only taste reasons (`not-my-taste`, free text about the work, attended ratings and notes, saves) may change likes and dislikes. Logistics reasons (`too-expensive`, `bad-timing`, `too-far`) may only propose practical constraints, such as a budget ceiling or preferred days.
- After accepting, run `npm run rescore` (MCH-011) so scores reflect the new profile.

## Acceptance
- With the Claude client mocked and fixture interactions, every proposed change lists the interaction ids it is based on (test).
- Fixture interactions made only of `bad-timing` rejections produce no changes to likes or dislikes (test).
- With no new interactions, the command reports "nothing to learn" and makes no API call.
- The real profile is never modified without `--accept` (test).

## Notes
- Start this only after a few weeks of real feedback; with little data the proposals will be noise.
- The human approval step mirrors `/spec-approve`: the system proposes, you decide.

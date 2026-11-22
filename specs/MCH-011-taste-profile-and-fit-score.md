---
id: MCH-011
title: Taste profile, fit score and why-go line
status: backlog
impacts: [backend, db]
who: [pentchomakov]
source: human
branch:
deps: [MCH-004]
created: 2026-11-22
paths: []
---

## Summary
Curation from day one, without waiting for learning: a taste profile you write yourself, which the extraction step reads to give every work a one-line reason to go and a fit score. This is what keeps the list from becoming another firehose.

## Requirements
- A taste profile file in plain prose: likes, dislikes, budget, neighbourhoods, preferred days and times. Commit `config/taste.example.md`; keep the real profile in a gitignored `config/taste.md` if the repository is public.
- The shared extraction step (`server/scan/extract.ts`, MCH-004) adds per work: `why_go` (one line, at most 140 characters, specific to the profile), `fit_score` (1 to 5) and `fit_reason` (short).
- The taste profile sits in the stable, cached prefix of the prompt (prompt caching), so it is not re-billed at full price for every source.
- Migration adding these columns to `works`.
- `npm run rescore` re-scores upcoming works against the current profile without re-fetching any page.
- `GET /api/works?sort=fit` orders by fit score.

## Acceptance
- With the Claude client mocked, extraction stores `why_go`, `fit_score` and `fit_reason` (vitest).
- `npm run rescore` updates scores and makes no fetch or search calls (test).
- Adding "I dislike musicals" to the profile lowers the score of a musical in the golden set (manual run, record in Notes).
- Within one scan run, the second and later extraction calls report cache-read tokens greater than zero (log check).

## Notes
- No learning in this ticket. MCH-013 proposes profile updates from your feedback.
- Open question: whether the repository is public. If it is, the real profile must stay out of git.

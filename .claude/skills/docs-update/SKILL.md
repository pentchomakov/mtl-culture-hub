---
name: docs-update
description: >
  Review the codebase (whole, or a given area/diff/feature) and bring the documentation up to date — refresh
  the affected docs under docs.recurseDirs, keep the master index (docs.home) + all relative links valid, and
  flag stale or contradicted sections. The code→docs maintenance loop; run after shipping features or when
  docs drift. Use when the user says "update the docs", "the docs are stale", "document this change", or
  "/docs-update [area]". Edits docs only (no app code, no deploy).
argument-hint: "[area/feature/diff to reconcile, e.g. 'auth' or 'PREFIX-074' — omit for a full sweep]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# docs-update — reconcile the docs with the code

Bring the docs into agreement with the current code for `$ARGUMENTS` (an area, feature, ticket id/diff, or a
full sweep if omitted). Edits **docs only** — never app/src code, never deploy.

## Step 0 — Config (do this first)
Read **`spec-kit.config.json`** at the repo root. If it is missing, say so and stop (suggest `/spec-init`).
The docs you maintain are the config's:
- **`docs.recurseDirs[]`** — the doc trees you edit (e.g. `docs/`); add/correct content here.
- **`docs.rootFiles[]`** — root docs (e.g. `README.md`) that may also need updating.
- **`docs.home`** — the master index to keep current when docs are added/renamed.
- **`docs.groups[]`** — the section map; use it to locate the doc(s) covering a subsystem and to keep new
  docs in the right section.
You do **not** edit `<specsDir>/` tickets here — those are the design-decision record, not docs.

## Scope first
- **Targeted** (`$ARGUMENTS` given): identify the subsystem(s) it touches and the doc(s) that cover them
  (use `docs.groups[]` / `docs.home`; or run `docs-lookup` to find them). For a ticket id / diff, read the
  change (`git show` / the ticket) and find which docs describe that surface.
- **Full sweep** (no args): walk the corpus (`docs.recurseDirs[]` + `docs.rootFiles[]`) section by section
  and spot-check each against its source.

## Steps
1. **Locate the source of truth** for the area — the relevant code (routes/libs/components), schema files,
   API contracts, config/bindings, or migrations. Read the code, not your memory.
2. **Diff doc vs. code.** For each relevant doc, check claims against the code: file paths, names, endpoints,
   env/bindings, schema, statuses, commands. Note every mismatch.
3. **Update the docs** in place — correct stale content, add coverage for anything new/undocumented, keep
   the section folder structure and front-matter conventions. Preserve voice/format.
3a. **Run the register pass** (`docs/delivery/registers/README.md`) for every doc changed in step 3. A claim the
   update rests on that no source confirms becomes an `A-NNN` row; a choice the docs now record becomes a
   `D-NNN` row; an item the update opens or closes, or whose owner or date it changes, goes in the open-items
   summary first, and the summary is re-dated. A stale or contradicted section you flag in step 5 also lands
   in the open-items summary with an owner. Then run `python3 tools/check-registers.py`.
4. **Keep the index + links valid.** Update `docs.home` (the master index) if docs were added/renamed;
   verify every relative link still resolves (`grep` for moved/renamed targets — no dangling links).
5. **Flag what you couldn't reconcile** — anything ambiguous or contradicted that needs a human decision
   (don't silently guess). List it for the user.
6. **Verify rendering** — the changed docs render in the docs portal (`/docs`): tables/code/mermaid intact,
   links navigate. Report a tight summary of what changed + any flags, and the register pass result
   (rows opened, closed or converted, open items changed, or "register pass: no change").

## Optional commit
Only if the user asks, commit the doc edits via the **`git`** skill (branch first if on a protected branch);
otherwise leave the edits for review.

## Guardrails
- Docs only — do not touch app/src code, run migrations, or deploy.
- **Never hand-edit generated content.** If `docs.buildCommand` is set, part or all of the docs tree is
  produced by that generator, and a hand edit there is silently overwritten by the next run. The fix is
  always upstream: correct the source the generator reads, or correct the generator, then run
  **`/docs-build`**. Hand-written hub and index pages are the exception, and they are the only exception:
  if you cannot tell which a page is, check whether the generator claims it before typing in it.
- Accuracy over completeness: a correct, smaller update beats a sweeping but speculative one. When the code
  is the source of truth and a doc disagrees, fix the doc — never "fix" the code from here.
- Never edit the design-decision record in `<specsDir>/`; this skill maintains `docs.recurseDirs[]`, not
  tickets.
- The registers are edited row by row through the register pass, never bulk-rewritten or re-sorted. A
  row is closed or superseded, never deleted, and an id is never reused. A client-facing page never
  carries a register id; the cloud build fails on one.

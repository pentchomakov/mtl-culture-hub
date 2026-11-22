---
name: spec-ideate
description: >
  Autonomously ideate future work — enhancements, test-coverage gaps, and bug fixes — and drop them on the
  board as PROPOSED tickets for the user's approval. Use when the user says "ideate", "find things to
  improve", "propose some specs", "what should we build/fix next", "/spec-ideate", or runs "/loop
  /spec-ideate" for continuous discovery. Investigates statically (code/docs/roadmap/contracts) AND
  dynamically (runs/browses the app locally to find reproducible bugs), then writes deduped `source: ai` +
  `status: proposed` tickets. NEVER touches human tickets or the build queue — proposals wait for
  /spec-approve.
argument-hint: "[optional: focus area, e.g. 'auth', 'tests', 'onboarding bugs']"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# spec-ideate — propose future work (AI → proposed)

Generates candidate tickets for the user to approve. Proposals are **second-class by design**: they
never enter the build flow until the user runs `/spec-approve`. Human priorities always lead.

**Loopable** (see `<SPECS>/README.md` → Loopable skills): `/loop /spec-ideate` is continuous discovery.
Each pass re-reads the config, dedupes against every existing ticket **including `rejected` ones**, and
stops dead at the approval gate, which is what makes an unattended loop safe here: the worst outcome is a
few more proposals nobody asked for, never work nobody approved.

## Step 0 — Read the config (required)
Read **`spec-kit.config.json`** at the repo root. If it is missing, the project isn't initialized — tell
the user to run `/spec-init` and **stop**. From it, bind:

- **`PREFIX`** = `prefix` — the ticket id prefix (e.g. `PAW`, `ACME`).
- **`SPECS`** = `specsDir` — where tickets live (e.g. `specs`).
- **`IMPACTS`** = `impacts[]` — the authoritative surface taxonomy for this project.
- **`INTEGRATION`** = `branching.integration || branching.trunk` — the branch where ticket status lives and
  where proposals are committed.

## Procedure
1. **Load context + avoid dupes.** Read existing `<SPECS>/<PREFIX>-*.md` (all statuses) so you don't
   re-propose something already tracked, `backlog`, in flight, or already `rejected`. Skim `docs/`, the
   roadmap, any shared API/schema contracts, and `CLAUDE.md` for direction and constraints (use
   `/docs-lookup <area>` to pull the relevant docs quickly).
2. **Investigate (static + dynamic):**
   - **Static** — read the codebase for enhancement opportunities, missing/weak test coverage, TODOs,
     fragile patterns, and likely bugs (error handling, edge cases, contract drift between shared contracts
     and the clients). Confine candidate `impacts:` to the config's `impacts[]` taxonomy.
   - **Dynamic** — launch and exercise the app **locally** to surface **reproducible** bugs. Use the
     project's own **`/run`** (and **`/verify`** where available) skill to start it; if there is none, fall
     back to a detected dev server / entry point (e.g. `npm run dev`, `make run`, the documented run
     command). **Local only — never exercise a staging or production environment with test writes.**
     Capture concrete repro steps.
3. **Draft proposals.** For each idea, create `<SPECS>/<PREFIX>-NNN-<slug>.md` (next sequential id) from
   `<SPECS>/TEMPLATE.md` with:
   - `source: ai`, `status: proposed`, non-empty `impacts: [...]` (from the config taxonomy), `deps: []`,
     today's `created:`, empty `branch:`, and `who:` stamped with the creator's login exactly as
     `/spec-new` does it (`gh api user -q .login`, falling back to a lowercase-hyphenated
     `git config user.name`). A proposal is still someone's proposal: `source: ai` records that Claude
     drafted it, `who:` records at whose session it was drafted.
   - Summary / Requirements / Acceptance / Notes — and in Notes, the **evidence** (file refs or repro
     steps) and a one-line **why it matters / priority hint**.
   - Keep each a single shippable unit; categorize in the title prefix where useful
     (`Enhancement:` / `Test:` / `Bug:`).
4. **Dedupe before writing.** If an idea overlaps an existing ticket, skip it (or note the overlap) —
   don't create near-duplicates. If a previously-`rejected` ticket covers it, don't re-propose.
5. **Write the proposals on INTEGRATION under the `spec-new-id` lock + direct-write pattern** (same
   collision-proof flow as `/spec-new`, so concurrent id assignment is race-free):
   a. **Be on INTEGRATION** (`git switch <INTEGRATION>` if needed). **Acquire — directly, NOT inside
      `$(...)`:** `bash tools/spec-coord/coord.sh acquire spec-new-id`.
   b. **Sync + compute the starting id with the every-ref scan** (identical to `/spec-new` step 5c:
      `git fetch --all --prune`, then `git ls-tree -r --name-only "$r" -- <SPECS>` over
      `git for-each-ref --format='%(refname)' refs/heads refs/remotes`, take the highest
      `<PREFIX>-NNN`); assign sequential ids (highest + 1 upward). A branch-local scan cannot see ids
      already reserved in a sibling worktree or on an unmerged branch.
   c. **Write all proposal files** with the front-matter from step 3.
   d. **Commit (+ push if `origin` exists):**
      ```
      git add "<SPECS>"
      git commit -m "spec: propose <PREFIX>-NNN … (ai)"
      git remote get-url origin >/dev/null 2>&1 && git push origin <INTEGRATION>
      ```
      Stage with the **path** `git add "<SPECS>"` (a `<PREFIX>-*.md` glob errors under zsh when nothing
      matches).
   e. **Release — directly, NOT inside `$(...)`; also release on failure:**
      `bash tools/spec-coord/coord.sh release spec-new-id`.
6. **Report** the proposals as a list (id · title · impacts · why) and tell the user they're in the
   board's **"Proposed by Claude"** panel, awaiting `/spec-approve <PREFIX>-NNN` (or reject).

## Guardrails
- **Never** change a `human`-sourced ticket, never flip anything to `backlog`/`in-progress`, never branch
  or deploy. Output is only new `proposed` files.
- Dynamic checks run against **local only** — never exercise staging or prod with test writes.
- **Direct lock calls only.** `coord.sh acquire`/`release` MUST be called directly (not inside `$(…)`).
- Stay deduped and bounded — if you cap how many you propose in one run, say so (no silent truncation).
- Proposals are suggestions; the user's focus and priorities always win.

## Closing
Proposals wait for `/spec-approve`. If you started a beacon, run
`bash tools/spec-coord/coord.sh session-end` when done.

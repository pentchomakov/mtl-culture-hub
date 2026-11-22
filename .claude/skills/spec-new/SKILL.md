---
name: spec-new
description: >
  Create one or many feature/fix tickets in the specs dir from a description OR a large pasted
  requirements dump. Use when the user wants to add to the backlog — "new ticket", "create a spec for X",
  "add a feature", "log this idea", "plan these requirements", "/spec-new", or when they paste a spec to
  formalize. Single clear ask → one ticket. Big/fuzzy dump → brainstorm to converge on scope, then
  decompose into multiple independent tickets. Scaffolds <SPECS>/<PREFIX>-NNN-<slug>.md with
  front-matter (id/title/status/impacts/who/source/branch/deps/created) + drafted
  Summary/Requirements/Acceptance/Notes, then shows them. Does NOT start a branch (that's /spec-start).
argument-hint: "[feature description OR a pasted list of requirements]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# spec-new — add ticket(s) to the feature library

Turn a description (or a pasted spec/requirements dump) into well-formed ticket(s) in the project's specs
dir. See `<SPECS>/README.md` for the format. **Be specific about impacted surfaces** — that's what
drives verification and (when configured) the ship gates.

## Step 0 — Read the config (required)
Read **`spec-kit.config.json`** at the repo root. If it is missing, the project isn't initialized — tell
the user to run `/spec-init` and **stop**. From it, bind:

- **`PREFIX`** = `prefix` — the ticket id prefix (e.g. `PAW`, `ACME`).
- **`SPECS`** = `specsDir` — where tickets live (e.g. `specs`).
- **`IMPACTS`** = `impacts[]` — the authoritative surface taxonomy for this project.
- **`INTEGRATION`** = `branching.integration || branching.trunk` — the branch where ticket status lives and
  where new tickets are committed.
- **`SIM`** = `simSignoff` (e.g. `{ enabled, triggerImpacts[] }`; absent/off ⇒ no sign-off gate).

> **Ground it in the docs.** Before drafting, run `/docs-lookup <topic>` to pull the relevant existing docs
> (architecture, schema, API, conventions) so Requirements/Acceptance reference real file paths and behavior.

## Pick a mode
- **Single clear feature/fix → one ticket** (fast path). Use the Steps below directly.
- **Large / multi-feature / fuzzy dump → decompose** (the "plan these reqs" case). Use Decompose mode.

## Steps (single ticket)
1. **(Optional) Beacon.** To warn about concurrent sessions, run
   `bash tools/spec-coord/coord.sh session-begin "" "spec-new"` (advisory; prints "⚠ N other sessions
   live" if any, self-heals dead sessions). Skip for a quick solo run.
2. **Slug.** kebab-case of the title (short, e.g. `weekly-summary-email`).
3. **Determine `impacts:`** — the authoritative, multi-valued list of touched surfaces, chosen from the
   config's `impacts[]` taxonomy (ask only if genuinely unclear). See `<SPECS>/README.md` for what each
   surface means in THIS project. A wrong axis skips the right verification or the configured sign-off gate.
4. **(If `simSignoff.enabled`) note the gate.** When any chosen impact is in `simSignoff.triggerImpacts[]`,
   this ticket will require sign-off before it can ship — call that out in `## Notes` so it's expected. The
   gate derives from `impacts:` + config; do **not** add a separate front-matter flag (the generic schema
   has none — see `<SPECS>/TEMPLATE.md`).

   4a. **Every ticket carries its tags.** Two are not optional:
   - **`impacts:` is mandatory and non-empty.** It is the axis verification and the board's Tags panel both
     read; a ticket without it is invisible to both. Never write `impacts: []`.
   - **`who:` is stamped with the creator's login**, resolved once:
     ```
     gh api user -q .login 2>/dev/null || git config user.name | tr '[:upper:] ' '[:lower:]-'
     ```
     The fallback is the lowercase-hyphenated `git config user.name`, for a project with no `gh`. Later
     touches are appended by the orchestrating skills on INTEGRATION, never here.

5. **Assign id, write ticket, commit — on INTEGRATION, under the narrow id lock.**

   The id lock is the one genuine cross-session race: two concurrent `spec-new` sessions computing
   "max id + 1" from the same baseline would mint the same `<PREFIX>-NNN`. The `spec-new-id` lock + a sync
   inside it prevents that. In a single session it's instant/uncontended.

   a. **Be on INTEGRATION** (`git switch <INTEGRATION>` if needed — `spec-new` writes tickets to the
      integration branch, it doesn't branch).

   b. **Acquire the lock — call directly, NOT inside `$(...)`** (so Ctrl-C signals reach it):
      ```
      bash tools/spec-coord/coord.sh acquire spec-new-id
      ```
      Blocks (wait-and-queue) until held. Do NOT wrap in a command substitution.

   c. **Sync, then compute the next id from EVERY ref, not just this branch.** Inside the lock:
      ```
      git fetch --all --prune
      for r in $(git for-each-ref --format='%(refname)' refs/heads refs/remotes); do
        git ls-tree -r --name-only "$r" -- <SPECS> 2>/dev/null
      done | grep -oE '<PREFIX>-[0-9]{3}' | sort -u | tail -1
      ```
      The new id is that + 1, zero-padded to 3 digits.

      **Scanning only the current branch is not enough, and on a real mandate it double-minted ids
      twice** (one ticket had to be renumbered after the fact). The `spec-new-id` lock serialises writers
      within one checkout; it cannot see a sibling worktree, another clone, or a branch nobody has merged
      yet. Only the ref list can. Note this is deliberately a scan of **refs** rather than of the working
      tree, so an id reserved on an unmerged feature branch still counts as taken.

   d. **Write the ticket file** `<SPECS>/<PREFIX>-NNN-<slug>.md` from `<SPECS>/TEMPLATE.md` with
      front-matter `status: backlog`, `source: human`, the chosen non-empty `impacts:`, `who:` stamped with
      the creator's login (step 4a), empty `branch:`, `deps: []`, `created:` = today's real date; draft the
      four sections from the description (real file paths / API routes where implied; testable Acceptance).

   e. **Commit (+ push if `origin` exists) on INTEGRATION:**
      ```
      git add "<SPECS>"
      git commit -m "spec: add <PREFIX>-NNN (<slug>)"
      git remote get-url origin >/dev/null 2>&1 && git push origin <INTEGRATION>
      ```
      Stage with the **path** `git add "<SPECS>"` (NOT a `<PREFIX>-*.md` glob — zsh errors on an
      unmatched glob). (If the push is rejected as non-fast-forward, `git pull --rebase origin <INTEGRATION>`
      and push again — still inside the lock.)

   f. **Release the lock — call directly, NOT inside `$(...)`:**
      ```
      bash tools/spec-coord/coord.sh release spec-new-id
      ```
      **Also release on failure** — if any step c–e errors, release before propagating. Never leave
      `spec-new-id` held after this step returns.

6. **Show the user** the created ticket path + a 1-line summary (id · title · impacts). Mention they can
   refine it or run `/spec-start <PREFIX>-NNN` to begin.

## Decompose mode (big requirements dump)
1. **Brainstorm to converge on scope.** Invoke `superpowers:brainstorming` to clarify intent and agree on
   what's in/out of scope. **Redirect its terminal handoff:** do NOT let it jump to `writing-plans` —
   return here to decompose into tickets (per-ticket implementation planning is `/spec-start`'s job).
2. **Decompose** the agreed scope into N coherent tickets, each a single shippable unit. **Bias toward
   independence** (minimize cross-ticket deps) so `/spec-swarm` can build them in parallel. For each,
   determine `impacts:` (step 3 above) and wire `deps:` so foundational tickets come first and dependents
   reference their prerequisite ids.
3. **Confirm the breakdown BEFORE writing files** — show a compact list: `id · title · impacts · deps`.
   Let the user merge/split/reorder.
4. **Assign ids and write all tickets on INTEGRATION under the `spec-new-id` lock — one critical section for
   the whole batch.**

   a. **Be on INTEGRATION**, then **acquire — directly, NOT inside `$(...)`:**
      ```
      bash tools/spec-coord/coord.sh acquire spec-new-id
      ```

   b. **Sync + compute the starting id with the every-ref scan** (identical to single-ticket step 5c:
      `git fetch --all --prune`, then `git ls-tree` over `git for-each-ref refs/heads refs/remotes`).
      Assign sequential ids (highest existing + 1, + 2, … upward) to the N tickets in the confirmed order.

   c. **Write all N ticket files** into the specs dir with `status: backlog`, `source: human`, chosen
      non-empty `impacts:`, `who:` stamped with the creator's login, today's `created:`, drafted sections.

   d. **Commit (+ push if `origin` exists) on INTEGRATION:**
      ```
      git add "<SPECS>"
      git commit -m "spec: add <PREFIX>-NNN … <PREFIX>-MMM (<batch description>)"
      git remote get-url origin >/dev/null 2>&1 && git push origin <INTEGRATION>
      ```

   e. **Release — directly, NOT inside `$(...)`; also release on failure:**
      ```
      bash tools/spec-coord/coord.sh release spec-new-id
      ```

5. **Report** the created tickets; suggest `/spec-start <first-id>` or `/spec-swarm` for the independent set.

## Shell guards

Four small rules. Each one exists because breaking it cost real work, and none of them cost anything to
follow:

| Rule | Why |
|---|---|
| **Stage by path, never a glob.** `git add "<SPECS>"`, not `git add <SPECS>/<PREFIX>-*.md` | zsh errors on an unmatched glob, so the whole command fails on the first run of a fresh project |
| **Call `coord.sh acquire`/`release` directly, never inside `$(...)`** | a command substitution swallows signal delivery: Ctrl-C during a queue wait leaves the lock held by a subshell nobody can reach |
| **`git commit -F <file>` for any message containing quotes** | an inline `-m "…\"…"` broke a quote, fragmented an `&&` chain, and fired an unintended deploy command in the tail of the line |
| **This shell is zsh: it does not word-split unquoted expansions** | `git cherry-pick $LIST` passes one bad revision, not several. Loop instead |

## Guardrails
- One ticket per file; never renumber existing ids. Don't invent scope the user didn't ask for — draft
  from what they gave, mark unknowns as open questions in `## Notes`.
- Be specific about `impacts:`, and never leave it empty — a wrong or missing axis skips the right
  verification, drops the ticket out of the board's Tags panel, and can skip the configured sign-off gate.
- **Id assignment is the critical-section.** Never compute "max id + 1" outside the `spec-new-id` lock, and
  always scan **every ref** inside the lock (step 5c), not just the current branch.
- Observe the four shell guards above; the lock-call and staging rules are the two that fail loudest.
- This skill writes ticket files to the specs dir and commits them to INTEGRATION directly. It does NOT
  create a git branch or change status to in-progress.

## Closing
If you started a beacon in step 1, run `bash tools/spec-coord/coord.sh session-end` when done.

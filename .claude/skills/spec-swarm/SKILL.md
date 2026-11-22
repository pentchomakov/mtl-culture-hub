---
name: spec-swarm
description: >
  Build many independent backlog tickets in parallel — each on its own feature branch, ending in
  pending-review awaiting the user's test. Use when the user says "build the ready tickets", "do these in
  parallel", "spec-swarm", "work the backlog", or "/spec-swarm". Selects independent backlog tickets (no
  unsatisfied/intra-batch deps), dispatches one worktree-isolated worker per ticket (each runs the
  spec-start plan/execute/verify flow on its own branch), flips status on the INTEGRATION branch as work
  progresses, and reports a branch↔ticket↔how-to-test table. Loopable via /loop /spec-swarm.
argument-hint: "[optional: <PREFIX> ids to include, else auto-selects the independent backlog set]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite, Agent, AskUserQuestion
---

# spec-swarm — parallel ticket runner

Drains the **independent** part of the backlog concurrently. This is the multi-feature analogue of
`/spec-start`: same plan → execute → verify rigor, but N tickets at once, each isolated on its own branch.
The dispatch pattern is written out in full in step 4 below: this skill is **self-contained** and does not
delegate to any other `swarm` skill.

This skill is **config-driven** — no hard-coded prefix, branch, or surface.

**Loopable** (see `<SPECS>/README.md` → Loopable skills): `/loop /spec-swarm` drains the backlog wave by
wave, because each pass re-reads the config, re-selects from ticket state, stops at every human gate, and
cleans up its own worktrees before returning.

## Step 0 — Read the config

Bind the **lifecycle roles** from `lifecycleRoles` in the config, and use them wherever this skill names a
status: **START** = `lifecycleRoles.start` (work begun), **REVIEW** = `.review` (awaiting review),
**TEST** = `.test` (integrated and verified on the integration branch; `null` when the lifecycle has no
such hop), **DONE** = `.done` (terminal). Where this skill says `in-progress`, read START; `pending-review`,
REVIEW; `testing`, TEST; `shipped`, DONE. When the config has no `lifecycleRoles`, derive them:
`in-progress`, `pending-review`, `testing` when it is in `lifecycle` else `null`, and the last entry of
`lifecycle`. When TEST is `null` the integration-and-staging hop does not apply: `/spec-test` re-verifies
and leaves the ticket at REVIEW, and `/spec-ship` ships from REVIEW. Never write a status that is not in
`lifecycle`: an off-list value makes the ticket vanish from every board column.
Read **`spec-kit.config.json`** at the repo root. It defines `name`, `prefix`, `specsDir`, `profile`,
`impacts[]`, `lifecycle[]`, `branching{trunk,integration,feature}`, `deploy{}`, and
`simSignoff{enabled,triggerImpacts[]}`. Let **INTEGRATION** = `branching.integration || branching.trunk`,
**FEATURE** = `branching.feature || "feat/"`, and **TRUNK** = `branching.trunk`. If the config is missing,
the project isn't initialized — tell the user to run `/spec-init` and stop.

Bind the same values spec-start uses: **PREFIX** = `prefix`, **SPECS** = `specsDir`, **PROFILE** = `profile`,
**IMPACTS** = `impacts[]`, **LIFECYCLE** = `lifecycle[]`, **DEPLOY** = `deploy`, **SIM** = `simSignoff`.
Derive the stage names **from LIFECYCLE** rather than hardcoding them; the terminal status is its last
entry. Status flips ALWAYS happen on **INTEGRATION**.

> **Never write a `status:` value that is not in LIFECYCLE.** The board builds its columns straight from
> that array, so an off-list status does not render as a warning: the ticket simply **vanishes** from every
> column, and the work looks abandoned to anyone reading the board.

## Procedure
1. **(Optional) Beacon.** To show this work on the board + warn about concurrent sessions, run
   `bash tools/spec-coord/coord.sh session-begin "" "spec-swarm"` (advisory only — self-heals dead sessions
   and prints a banner if another session is live). Skip for a quick solo run.
2. **Select the independent set.** From `<SPECS>/`, take `status: backlog` tickets whose `deps` are all
   `shipped` AND that don't depend on each other within the batch. Exclude `proposed`/`rejected` (AI ideas
   need `/spec-approve` first) and anything already in flight. If the user named ids, intersect.
   **Show the selected batch (id · title · impacts) and get a go-ahead** before dispatching.
3. **Size the batch.** Dispatch at most **N = min(10, cores − 2)** workers concurrently (read core count via
   `getconf _NPROCESSORS_ONLN` or `nproc`); queue the rest in subsequent waves.
4. **Per ticket (parallel, batched ≤N):**
   - **Orchestrator (you, on INTEGRATION):** flip the ticket → `status: in-progress` +
     `branch: <FEATURE><slug>` by editing `<SPECS>/<PREFIX>-NNN-*.md` directly on INTEGRATION, then
     `git add` + commit (`spec: <PREFIX>-NNN → in-progress`) + `git push origin <INTEGRATION>` if an
     `origin` remote exists. Single session ⇒ you're the only writer to INTEGRATION, so this is race-free —
     no lock. (Doing the whole batch's flips in one commit is fine.)
   - **Dispatch a worktree-isolated worker.** One worker per ticket, via the `Agent` tool with
     `isolation: "worktree"` (the harness worktree is the worker's sandbox; there is no extra coord setup
     step). The worker's brief is self-contained, because a fresh agent knows nothing about this project:
     - the **full ticket text** plus its `impacts`, and pointers to `spec-kit.config.json` + `CLAUDE.md`;
     - the branch to create: `git switch -c <FEATURE><slug>` off INTEGRATION;
     - the job: implement per the ticket's Requirements/Acceptance with `/spec-start`'s
       plan → execute → verify rigor, then push the branch (when a remote exists);
     - the region it owns, when a sibling worker is in the same file (see the independence guardrail);
     - the standing constraints: run the typecheck/tests, **do not deploy**, and
       **carry CODE only: never edit spec front-matter** (that is what keeps `<SPECS>/` conflict-free).
     - **When the ticket's `impacts` include a UI surface**, name the design skills explicitly in the
       prompt: **`cdl-use`** (component vocabulary), **`cdl-build`** (build/sync),
       **`cdl-design-standards`** and **`cdl-demo-conventions`**, plus the **App style standard** in
       `CLAUDE.md`. A worker will not infer any of this, and one that skips it invents a look the rest of
       the app contradicts. State the two hard rules in the prompt, because they are the ones a worker
       breaks first: **`CdlPageContainer` is mandatory as every page's outermost shell, and a custom
       layout wrapper is not an option**; and **a hand-rolled KPI card, table or drawer is a defect
       wherever a Cdl component exists** (`CdlKpiCard`, `CdlDataTable`, `CdlDrawer`, and the rest of the
       installed set). `npm run check:cdl` fails on the first of those, so a worker that ignores it hands
       back a branch that cannot pass verify.
     Route by complexity: well-scoped work to a fast model, ambiguous design to the strongest one.
5. **On each worker success + self-verify**, move that ticket into review. This is **TWO things**, and the
   order matters:

   a. **Merge the worker's branch into INTEGRATION.** `git switch <INTEGRATION>` →
      `git merge --ff-only <FEATURE><slug>` (rebase the branch onto INTEGRATION first if the merge is not
      a fast-forward) → push INTEGRATION if `origin` exists.
   b. **Then flip the status** by a direct edit on INTEGRATION: set the review status from LIFECYCLE
      (`pending-review` in the default lifecycle) in `<SPECS>/<PREFIX>-NNN-*.md`, **append this worker's
      GitHub login to `who:`** if not already there, `git add` + commit
      (`spec: <PREFIX>-NNN → <review status>`) + push to `origin <INTEGRATION>` if a remote exists.

   **Status without the merge is a lie the reviewer discovers.** A ticket that reads "in review" while its
   content sits on an unmerged branch sends the reviewer to a surface where the work is not there, and they
   have no way to tell whether it was never done or never merged.

   Consequence worth stating: a ticket that comes out of a swarm is **already integrated**, so a later
   `/spec-test` on it has nothing to merge and goes straight to the staging deploy and the verification.
   Say so in the report, or someone will merge it a second time and wonder why the diff is empty.

   For `ios` tickets (PROFILE `ios`, ios in impacts) the worker builds via `/spec-sim-test`; the user still
   does the final device test.
6. **Reconcile + report** a table: `<FEATURE><slug> ↔ <PREFIX>-NNN ↔ how to test`. How-to-test follows the
   profile: for `full`/`ios` deployable surfaces it's the staging target via `/spec-test`; iPhone sim for
   `ios`; for `simple` it's the build / local-app / test-suite steps on the feature branch. Every branch is
   left pushed (or committed locally), awaiting the user's test. Flag any worker that failed — leave its
   ticket `in-progress`, don't fake `pending-review`.

## Guardrails
- **Independence is preferred, not absolute.** Tickets that touch the *same lines* of a file will merge-
  conflict — sequence those (or hand to `/spec-start`). Tickets that touch *different regions* of the same
  file are usually fine in parallel; brief each worker to keep to its own region, and reconcile at
  integration. When genuinely unsure, exclude and say so.
- Status flips happen ONLY on INTEGRATION, ONLY from the orchestrator (direct edits), and ONLY to values
  present in LIFECYCLE. Feature branches stay code-only, front-matter included.
- **The orchestrator owns `who:`.** It appends each worker's GitHub login when it flips that ticket's
  status; a worker never writes it, because a worker never touches front-matter.
- Deployable surfaces go to **staging** via **`/spec-test`** (→ `testing`, when in the lifecycle), never
  prod. Promotion to TRUNK is **`/spec-ship`**, after the user's test (and the sim sign-off for tickets
  whose impacts match `SIM`).
- Honor the secrets / deploy-account rules in `CLAUDE.md`.

## Closing
When all branches are pushed/committed and the table is reported:
1. `bash tools/spec-coord/coord.sh clean` — removes the finished worker worktrees, deletes dangling
   `worktree-agent-*` scaffold refs, and reaps dead sessions, returning you to "one session, zero
   worktrees." (It skips any worktree with tracked uncommitted changes and never deletes a `<FEATURE>*`
   branch.)
2. If you started a beacon in step 1, `bash tools/spec-coord/coord.sh session-end`.

---
name: autopilot
description: >
  Autonomously drive a multi-milestone roadmap to completion using the spec workflow + parallel subagents.
  Built for `/loop /autopilot` (the CLI's built-in loop), which fires the next iteration at each milestone
  boundary and is the intended way to run it hands-off.
  Use when the user says "keep going", "do all the milestones", "continuously work through the plan",
  "build the whole roadmap", or wants hands-off milestone-by-milestone delivery. Discovers the roadmap/plan,
  picks the next incomplete milestone, plans it, decomposes it into tickets via /spec-new, dispatches
  /spec-swarm to build them in parallel, verifies per the ticket impacts, deploys/ships only as far as the
  configured profile allows, commits via PR, then advances to the next milestone — pausing only to report at
  each boundary. Pair with the built-in /loop to run it continuously (e.g. `/loop /autopilot`).
argument-hint: "[optional: milestone id/name or 'next']"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, AskUserQuestion
---

# Autopilot — autonomous milestone driver

Drive a roadmap to completion one milestone at a time, through the spec workflow, with parallel subagents,
checking in only at milestone boundaries. This is the hands-off execution mode for a roadmap that has
already been planned and approved. It is **config-driven** — what "deploy/ship" means is dictated entirely
by the project's `profile` and `deploy` config; nothing about any specific host/platform is hardcoded.

## Step 0 — Config (do this first, every iteration)

Bind the **lifecycle roles** from `lifecycleRoles` in the config, and use them wherever this skill names a
status: **START** = `lifecycleRoles.start` (work begun), **REVIEW** = `.review` (awaiting review),
**TEST** = `.test` (integrated and verified on the integration branch; `null` when the lifecycle has no
such hop), **DONE** = `.done` (terminal). Where this skill says `in-progress`, read START; `pending-review`,
REVIEW; `testing`, TEST; `shipped`, DONE. When the config has no `lifecycleRoles`, derive them:
`in-progress`, `pending-review`, `testing` when it is in `lifecycle` else `null`, and the last entry of
`lifecycle`. When TEST is `null` the integration-and-staging hop does not apply: `/spec-test` re-verifies
and leaves the ticket at REVIEW, and `/spec-ship` ships from REVIEW. Never write a status that is not in
`lifecycle`: an off-list value makes the ticket vanish from every board column.
Read **`spec-kit.config.json`** at the repo root. If it is missing, say so and stop (suggest `/spec-init`).
Pin these for the iteration:
- **`profile`** — `simple` | `full` | `ios`. Drives how far autopilot ships (see "Deploy/ship gate").
- **`lifecycle[]`** — the ticket status flow (e.g. `backlog → in-progress → pending-review → [testing] →
  shipped`). Read the stage names from here, never hardcode them, and **never write a `status:` outside
  this array**: the board builds its columns from it, so an off-list value makes the ticket disappear from
  every column rather than showing up as an error.
- **`impacts[]`** — the surfaces tickets touch; drives per-ticket verification.
- **`branching{trunk, integration, feature}`** — INTEGRATION = `branching.integration || branching.trunk`.
- **`deploy{staging, prod}`** — the shell commands (may be `null`).
- **`simSignoff`** — if enabled, tickets whose impacts hit `simSignoff.triggerImpacts` need the owner's
  sim/device sign-off before they can ship.
- **`specsDir`**, **`name`**, **`prefix`**.

## When to use
- The user has an approved plan/roadmap and says "keep going" / "do all the milestones".
- Run continuously by wrapping in the built-in loop: `/loop /autopilot` (self-paced — fires the next
  iteration after each milestone boundary).

## Inputs — discover the roadmap generically (every iteration)
Find the ordered milestones using whatever this project actually has, in order of preference. **Don't assume
a path** — discover it:
1. **Roadmap file** — glob for a roadmap (e.g. `**/roadmap*.md`, `**/ROADMAP*.md`, `docs/**/roadmap.md`,
   or whatever `docs.recurseDirs[]` contains). If found, its ordered headings/sections are the milestones.
2. **Plan file** — an active plan (e.g. `**/plan*.md`, `PLAN.md`, a `superpowers` plan) listing milestones.
3. **Backlog grouping** — else derive milestones from `<specsDir>/*.md`: group `backlog` tickets by a
   milestone/epic field or by an `M1`/`M2` naming convention; each group is a milestone in order.
4. **Task list** — if a `TaskList` exists, its first non-`completed` milestone task is the target.
If none of these exist, **ask the user once** for the roadmap (file path or a quick milestone list), then
proceed. Honor an explicit milestone id/name passed in `$ARGUMENTS`; otherwise take the first incomplete one.

Also read **project memory / `CLAUDE.md`** for locked architecture decisions and
conventions. Re-verify any memory that names a file/flag/command before relying on it.

## Per-milestone procedure
1. **Plan the milestone.** Restate its scope from the roadmap in one or two lines. Lock any cross-cutting
   contract (e.g. the API/data boundary between independently-built pieces) BEFORE decomposing, so parallel
   work doesn't diverge.
2. **Decompose into tickets via `/spec-new`.** Turn the milestone scope into one or more independent backlog
   tickets (set `impacts` per the project taxonomy, `deps` where ordering matters). This keeps every unit of
   work on the board and indexable. (Human-led/approval-gated proposals are not autopilot's job — it builds
   approved/backlog work.)
3. **Dispatch `/spec-swarm`.** Run the milestone's independent backlog tickets in parallel via `/spec-swarm`
   — one worktree-isolated worker per ticket, each running the spec-start plan→execute→verify flow on its
   own `feature` branch and ending in `pending-review`. `/spec-swarm` flips status on the INTEGRATION branch
   as work progresses. For tightly-coupled or verification-critical work, you may keep a unit in the main
   thread instead. Route by complexity (well-scoped → `sonnet`; ambiguous design → the strongest model) and
   give each worker a self-contained brief (paths, contract, constraints, "don't deploy", "run
   typecheck/tests"). **For a ticket whose `impacts` include a UI surface, name the design skills in the
   dispatch**: `cdl-use`, `cdl-build`, `cdl-design-standards`, `cdl-demo-conventions`, plus the **App
   style standard** in `CLAUDE.md`. A fresh worker will not infer the project's design system from the
   code it happens to open. (`cdl-primitive-sync` is installed too but is a maintenance skill, not a build
   one: naming it in a build brief invites a worker to refresh primitives mid-ticket.) Carry the two hard
   rules into the brief verbatim: **`CdlPageContainer` is every page's outermost shell and a custom layout
   wrapper is forbidden**, and **a hand-rolled KPI card, table or drawer is a defect wherever a Cdl
   component exists** (`CdlKpiCard`, `CdlDataTable`, `CdlDrawer`, and the rest of the installed set).
   `npm run check:cdl` enforces the first, so a milestone whose workers ignored it fails verification
   rather than shipping a second look.
4. **Integrate & verify per impacts.** When workers report, TRUST BUT VERIFY — read the actual diffs / run
   the build. Then verify each ticket against its **`impacts`**:
   - UI/frontend impacts → exercise the golden path in a real browser; the headless preview freezes
     CSS/JS animations at their first frame, so force the end-state before screenshotting — never conclude
     "broken" from a frozen frame.
   - data/db impacts → confirm persistence (reload → still there) and that nothing is stored locally when it
     should be server-backed; apply migrations to the right target per the deploy step.
   - native/ios impacts (when present) → defer device/sim verification to the `simSignoff` gate.
   Use the project's own verify/run skills if it has them.
5. **Deploy/ship — gated by `profile` + `deploy`.** This is where autopilot stops vs. continues:
   - **`profile: simple` OR `deploy` commands are null** → there is no deploy ceremony. Take each verified
     ticket as far as the lifecycle allows without a deploy: merge its `feature` branch to INTEGRATION (and,
     if `simple` is trunk-only, that *is* trunk → `/spec-ship` to promote to `shipped`). If the project has
     no automated deploy, **stop at `pending-review` / merge** and report — do not invent a deploy.
   - **`profile: full` or `ios`** → run the deploy lifecycle: **`/spec-test`** to integrate each ticket onto
     INTEGRATION and deploy to staging (`deploy.staging`) for review; for `ios`-impact tickets gated by
     `simSignoff`, run **`/spec-sim-test`** and wait for the owner's sign-off; then **`/spec-ship`** to
     promote INTEGRATION → trunk and deploy prod (`deploy.prod`). Apply migrations with the deploy per the
     project's documented per-target sequence. Run the exact `deploy.staging` / `deploy.prod` commands from
     the config — never hardcode a platform, host, or account.
6. **Commit via PR (the `git` skill).** Promotions to trunk go through a PR (`git` skill: branch → PR →
   merge), per the gated-trunk rule. Keep secrets out of the repo and never mutate/rotate a secret without
   explicit per-key permission.
7. **Update docs + roadmap.** Run **`/docs-update`** for the area you changed, and mark the milestone done
   in the roadmap/plan/`TaskList`.
8. **Refresh the recap.** At every milestone boundary, run **`/spec-recap`** so `<specsDir>/RECAP.md`
   reflects the state you are handing back. This is the whole point of the boundary: a loop that advances
   without leaving a readable summary behind is a loop nobody can supervise.
9. **Report & advance.** Post a tight report (what shipped, what's live/where it stopped, what's next), then
   move to the next incomplete milestone.

## Running it continuously

`/loop /autopilot` is the intended usage. `/loop` is a Claude Code CLI built-in, so there is nothing to
install, and autopilot is **self-pacing**: each iteration re-reads the config, takes the next incomplete
milestone from the roadmap, and returns at the boundary, so the next fire has real work rather than a
repeat. It satisfies the loopable contract in `<specsDir>/README.md`, including the part that matters most
here: **it stops at every human gate instead of pushing through it.**

## Guardrails
- **Never self-approve a human gate.** Any status flip the project defines as a human decision (an
  approval, a sign-off, a client acceptance) is a full stop: report what is ready, hand back, and wait. An
  autonomous loop granting its own approval turns the whole gate into decoration, and the loop is exactly
  the context where nobody is watching the moment it happens.
- Confirm reversibility before risky/destructive or shared-state actions. Deploys and PR merges at milestone
  boundaries are pre-authorized by the user's "do all the milestones" instruction, but still report them.
- **Honor the profile.** Never deploy/ship further than `profile` + `deploy` allow. If `deploy` is null,
  there is nothing to deploy — stop at merge/pending-review and say so.
- Respect every ship gate: gated-trunk PRs, `simSignoff` for native/data tickets, data-safe prod migrations.
- Clean up every subagent/worktree you spawn; never leave dangling processes. (`/spec-swarm` and
  `tools/spec-coord/coord.sh clean` handle worktree teardown.)
- If a milestone is genuinely blocked (missing secret, external dependency, ambiguous requirement only the
  user can resolve, or a sim sign-off pending), stop and ask — don't guess past a one-way door.
- Stay within the approved roadmap's scope; don't invent new milestones.

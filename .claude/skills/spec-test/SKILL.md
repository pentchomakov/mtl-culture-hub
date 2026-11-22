---
name: spec-test
description: >
  Put a pending-review ticket into the testing stage — integrate its feature branch into the integration
  branch and (when a staging deploy is configured) deploy to staging for the user to verify. Use when the
  user says "test <PREFIX>-NNN", "deploy <PREFIX>-NNN to staging", "put it on staging", or "/spec-test".
  Moves the ticket pending-review → testing. Accepts multiple ids (they accumulate together on the
  integration branch / staging). Config-driven: with no staging deploy (simple profile) it just integrates
  and advances the board; with one set it acquires the staging lock around the deploy.
argument-hint: "<PREFIX>-NNN [<PREFIX>-NNN ...]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
---

# spec-test — integrate a feature and (optionally) put it on staging

Promotes `pending-review` ticket(s) toward shipping: integrate the feature branch into the **integration**
branch, optionally deploy to **staging** for real verification, and flip the ticket to `testing`. Tickets
in `testing` accumulate together on the integration branch (this is the integration-test step).

This skill is **config-driven** — it carries no hard-coded prefix, branch name, surface, or deploy command.
Everything project-specific is read from `spec-kit.config.json` at the repo root.

## Step 0 — Read the config (required)

Bind the **lifecycle roles** from `lifecycleRoles` in the config, and use them wherever this skill names a
status: **START** = `lifecycleRoles.start` (work begun), **REVIEW** = `.review` (awaiting review),
**TEST** = `.test` (integrated and verified on the integration branch; `null` when the lifecycle has no
such hop), **DONE** = `.done` (terminal). Where this skill says `in-progress`, read START; `pending-review`,
REVIEW; `testing`, TEST; `shipped`, DONE. When the config has no `lifecycleRoles`, derive them:
`in-progress`, `pending-review`, `testing` when it is in `lifecycle` else `null`, and the last entry of
`lifecycle`. When TEST is `null` the integration-and-staging hop does not apply: `/spec-test` re-verifies
and leaves the ticket at REVIEW, and `/spec-ship` ships from REVIEW. Never write a status that is not in
`lifecycle`: an off-list value makes the ticket vanish from every board column.
Read **`spec-kit.config.json`** at the repo root. If it is missing, the project isn't initialized — tell
the user to run `/spec-init` and **stop**. Bind:

- **`PREFIX`** = `prefix` · **`SPECS`** = `specsDir` · **`PROFILE`** = `profile` · **`IMPACTS`** = `impacts[]`.
- **`LIFECYCLE`** = `lifecycle[]` — the ordered status list for this project.
- **`INTEGRATION`** = `branching.integration || branching.trunk` — where ticket status lives and where
  features integrate. **`FEATURE`** = `branching.feature || "feat/"`. **`TRUNK`** = `branching.trunk`.
- **`DEPLOY`** = `deploy` (`{ staging, prod }`; each a shell command string or `null`).
- **`SIM`** = `simSignoff` (`{ enabled, triggerImpacts[] }`; absent/off ⇒ no sign-off gate).

The primary checkout sits on **INTEGRATION**; that's where you flip status.

## Steps

1. **(Optional) Beacon.** To show this work on the board / warn about concurrent sessions, run
   `bash tools/spec-coord/coord.sh session-begin "<PREFIX>-NNN" "spec-test"` (advisory; self-heals dead
   sessions). Skip for a quick solo run.
2. **Resolve.** Match each arg to a `<SPECS>/<PREFIX>-NNN-*.md` that is `status: pending-review` (it has a
   `<FEATURE><slug>` branch recorded). If none/ambiguous, list pending-review tickets and ask.
3. **Preflight.** Working tree clean; `git switch <INTEGRATION>` and pull if an `origin` remote exists
   (`git fetch origin <INTEGRATION> && git merge --ff-only origin/<INTEGRATION>`).
4. **Integrate each feature branch (rebase → ff-merge):**
   - `git switch <FEATURE><slug>` → `git rebase <INTEGRATION>` (these branches may overlap — resolve
     conflicts; if the project uses ordered migration files and a filename collides with one already on
     INTEGRATION, **renumber it to the next free number**).
   - `git switch <INTEGRATION>` → `git merge --ff-only <FEATURE><slug>` → push INTEGRATION if `origin` exists.
   - **A ticket that came out of `/spec-swarm` is already integrated** (the swarm merges before it flips the
     status). Check first: if INTEGRATION already contains the branch, skip the merge for that ticket and
     say so, rather than reporting an empty diff as a problem.
   - The feature branch carries **code only** — it never edits its own ticket's front-matter, so this
     merge stays conflict-free in `<SPECS>/`.
5. **Deploy to staging — only when `DEPLOY.staging` is set.**
   - **`DEPLOY.staging` is `null` (e.g. the `simple` profile):** there is **no staging step**. Say so
     plainly — integration onto INTEGRATION is the verification surface here. Skip straight to step 6.
     (If `testing` isn't in `LIFECYCLE`, see step 6's note.)
   - **`DEPLOY.staging` is set:** acquire the narrow `staging` lock, run the deploy, then release it.
     Staging is single-tenant; the lock ensures only one session deploys at a time (a second session
     queues and waits). Run these on their **own lines, NOT inside `$(...)`**, so Ctrl-C during the queue
     wait reaches the wait loop:

     ```
     bash tools/spec-coord/coord.sh acquire staging
     <DEPLOY.staging>
     bash tools/spec-coord/coord.sh release staging
     ```

     **Always release the lock even if the deploy fails** — if `<DEPLOY.staging>` errors, still run
     `bash tools/spec-coord/coord.sh release staging` before aborting, so other sessions aren't blocked.
   - If a ticket added a data/schema migration, note it in the report (the staging deploy applied it to the
     staging stack — staging stacks are disposable; the same files go to prod only at `/spec-ship`).
   - Honor the **secrets / deploy-account rules in `CLAUDE.md`** — relevant only if `<DEPLOY.staging>` is a
     Cloudflare deploy (re-export the suffixed creds in the deploy shell; never persist them, never echo a
     secret, never put/delete/rotate one here).
5a. **Collect findings against each ticket's `## Acceptance`.** Exercise the change on the staging target
   (or, with no staging, on the integrated build) and write down every criterion that does not hold. This
   is the gate's actual output: see **Gate shape** below. Zero findings is the bar for step 6.
6. **Flip → `testing`** by a **direct edit on INTEGRATION** (you're already there after the integration),
   **only for tickets with zero findings**.
   - If `testing` **is** in `LIFECYCLE`: set `status: testing` in each integrated `<SPECS>/<PREFIX>-NNN-*.md`,
     then `git add "<SPECS>"` + commit (`spec: <PREFIX>-NNN → testing`) + push `origin <INTEGRATION>` if a
     remote exists. (One commit for the whole batch is fine.)
   - If `testing` is **not** in `LIFECYCLE` (the `simple` profile typically goes
     `... pending-review → shipped`): there is no `testing` state to advance to — leave the ticket at
     `pending-review` and tell the user the feature is integrated and ready; suggest **`/spec-ship`** to
     promote it.
7. **Sim sign-off note.** If `SIM.enabled` and a ticket's `impacts` intersect `SIM.triggerImpacts[]`, that
   ticket also needs an iPhone-simulator sign-off via **`/spec-sim-test <PREFIX>-NNN`** before it can ship —
   call it out in the report.
8. **Report.** Per ticket: pass or the findings list (each with its exact location), the staging URL /
   target (if deployed), and each ticket's `## Acceptance` as a checklist for the user to verify. Flag any
   sim-signoff-gated ticket (per step 7). When the user confirms a ticket works,
   **`/spec-ship`** promotes INTEGRATION → TRUNK, deploys prod (if `DEPLOY.prod` is set), sets the ticket
   `shipped` + `branch: <TRUNK>`, and deletes the feature branch.

## Gate shape (three rules, and they apply to any gate skill in this project)

1. **Every finding cites the exact spot.** A file and line, a route, the failing assertion, the log line,
   the screen. "Auth feels flaky" is not a finding: it cannot be fixed, argued with, or verified as fixed.
2. **Status flips only on zero findings.** One finding leaves the ticket where it is, with the list. There
   is no "mostly passing": a gate that advances a ticket it has doubts about is not a gate, and every
   later reader will trust the status rather than re-derive the doubt.
3. **It never silently fixes what it reviews.** Findings are reported, not patched. Fixing in the same pass
   destroys the evidence that the gate found anything, and hides a change nobody reviewed. If the user
   wants the fix, that is a separate, explicit ask (usually back through `/spec-start`).

## Guardrails
- Only act on `pending-review` tickets. Always rebase a branch onto INTEGRATION before the ff-merge so its
  history stays linear and overlaps / migration collisions get resolved.
- Observe the three gate-shape rules above. A finding without a location, or a flip with findings
  outstanding, is a defect in the gate, not a judgement call.
- **Migrations** apply to the staging stack at this step (disposable); **prod** migrations apply only at
  `/spec-ship`. Any local `--remote`-style apply against a real DB stays go-ahead-gated.
- Branches/reviews deploy to **staging**, never prod. Honor the secrets / deploy-account rules in `CLAUDE.md`
  whenever the deploy command targets Cloudflare.
- Status flips are **direct edits on INTEGRATION** (commit + push when a remote exists); the feature branch
  never touches its own spec.

## Closing
When the skill completes (ticket flipped to `testing` — or integrated when there's no `testing` state —
staging deploy verified if configured, report given):
1. `bash tools/spec-coord/coord.sh clean` — prune any finished worktrees + dangling `worktree-agent-*`
   scaffold refs + dead sessions (back to "one session, zero worktrees").
2. If you started a beacon in step 1, `bash tools/spec-coord/coord.sh session-end`.

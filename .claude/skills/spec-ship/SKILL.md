---
name: spec-ship
description: >
  Promote a verified feature to production, flipping the board and publishing as one operation. Use when the
  user confirms a feature works and says "ship it", "ship <PREFIX>-NNN", "land this", "promote and clean up",
  or "/spec-ship". Flips the ticket(s) to the terminal lifecycle status + branch: <trunk> with an outcome
  record, merges the integration branch into trunk, pushes integration then trunk (the trunk push is the
  deploy where CI is wired), runs the production deploy where it is not, and deletes the shipped feature
  branch(es). Config-driven: honors the project branching strategy, the staging/prod deploy commands, and the
  "secrets are sacred" / Cloudflare-account rules when (and only when) the deploy is a Cloudflare deploy.
argument-hint: "[<PREFIX>-NNN ...] (or a feature branch name)"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
---

# spec-ship — promote to production, board and trunk in one move

The closing bookend of the spec flow. Run it only when the user has **confirmed the feature works** (see
`/spec-test` — real verification, not just a green build). **The flip and the publish are one operation:
flip the ticket on INTEGRATION, fast-forward TRUNK onto that flip, then push INTEGRATION and TRUNK in that
order.** A ticket reads the terminal status and `origin/<TRUNK>` carries both the code and the flip by the
end of the same session, or neither does.

That ordering is required, not preferred. `tools/docs-site/scripts/check-board-matches-deploy.mjs` refuses
any ticket at a `docs.statusGating.requireOnDeploy` status whose file on `origin/<TRUNK>` does not carry
the same status, and `tools/githooks/pre-push` runs it on every INTEGRATION push. Flip the board after
pushing and the ship's own last push is refused, and so is every INTEGRATION push after it until somebody
re-ships. Flip first and the hook's staged-push window is satisfied by construction: local TRUNK is ahead
of `origin/<TRUNK>` and already carries the statuses, which is the one case that window exists for.

This skill is **config-driven** — no hard-coded prefix, branch name, surface, or deploy command. Everything
project-specific is read from `spec-kit.config.json` at the repo root.

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
- **`LIFECYCLE`** = `lifecycle[]`; **`TERMINAL`** = the last entry of `lifecycle[]` (e.g. `shipped`).
- **`TRUNK`** = `branching.trunk` — the always-deployable rollback line; ship promotes onto it.
- **`INTEGRATION`** = `branching.integration || branching.trunk`; **`FEATURE`** = `branching.feature || "feat/"`.
- **`DEPLOY`** = `deploy` (`{ staging, prod }`; each a shell command string or `null`).
- **`SIM`** = `simSignoff` (`{ enabled, triggerImpacts[] }`).

> **Trunk-only / no-prod note.** When `INTEGRATION === TRUNK` there is no integration→trunk hop — promotion
> is just "integrate the feature onto TRUNK". When `DEPLOY.prod` is `null` there is no production deploy step
> — shipping just lands the code on TRUNK and updates the board.

## Step 0a — Coordinate
Run `bash tools/spec-coord/coord.sh session-begin "<PREFIX>-NNN" "spec-ship"`, substituting the first ticket
id from the args (or an empty string if not yet resolved). This registers the session (so the
refuse-if-mid-test check below works), prints the live-sessions banner if others are active, and reaps dead
sessions.

## Step 0b — Refuse-if-held (run BEFORE acquiring any lock)
Before touching TRUNK or prod, check whether any ticket in the ship set is held by another live session. If
so, **STOP** — do not acquire locks, do not proceed to Preflight. Name the holder (pid, op, ticket) in the
refusal: "another session is busy" is not actionable, and the user cannot decide whether to wait or
intervene without knowing which session and which operation.

```
bash tools/spec-coord/coord.sh status --json
```

Parse the JSON. For **each** ticket in the ship set, scan the `sessions` array: if any live session has
`"ticket": "<PREFIX>-NNN"` AND an `"op"` that is **not** `"spec-ship"` (e.g. `"spec-test"` / `"spec-sim-test"`),
that ticket is still being verified elsewhere. **STOP with:**

> ERROR: <PREFIX>-NNN is currently mid-test in another live session (pid=<pid>, op=<op>). Wait for that
> session to finish before shipping — a ticket still being tested must not land on prod.

Do not proceed if ANY ticket in the ship set is blocked. Continue only if all tickets are clear.

## Inputs (discover first)
1. **What to ship** — the `<PREFIX>` id(s) and/or feature branch(es). Tickets in `testing` are already
   integrated on INTEGRATION (via `/spec-test`); tickets in `pending-review` still need feature→INTEGRATION.
2. **Repo** — git root of the cwd. If `DEPLOY.prod` is a Cloudflare deploy, the credentials come from the
   deploy shell's environment (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`), never from the kit.

## Preflight (do not skip)
- `git status --short` → working tree MUST be clean (never `git add -A` past stray files).
- Confirm the user's "it works" is recent + explicit.
- **Sim-signoff gate.** If `SIM.enabled` and any ticket's `impacts` intersect `SIM.triggerImpacts[]`, the
  user MUST have inspected it on the iPhone simulator and approved (via `/spec-sim-test`) — else **STOP and
  ask**. For a data/schema-impacting ticket, confirm its migration was already proven on the disposable
  staging stack (it has NOT yet hit prod — that happens in this skill's deploy step).

## Pre-ship review & plan (REQUIRED for multi-ticket / large diffs; recommended always)
Before ANY git mutation, produce a written go/no-go review so the human sees exactly what lands. **All
read-only.** End with a per-feature walkthrough and **explicit go-ahead** — do NOT flip a ticket, merge, or
push until the user confirms. For a single tiny change you may abbreviate, but never skip the diff +
migration + (when Cloudflare) secrets checks.

1. **Scope.** Ship set = the named ticket(s) (or all `status: testing`, or — when there's no `testing`
   state — all `pending-review` integrated ticket(s), if none named). List each `id · title · impacts`.
   Confirm none are still `in-progress` (not ready).
2. **Code purity.** `git fetch origin` (if a remote exists) then `git diff --stat origin/<TRUNK>..<INTEGRATION>`
   (use local `<TRUNK>..<INTEGRATION>` if no remote). Every changed file must map to a ship-set ticket.
   **FLAG any code change from an unshipped ticket not in the ship set** — its code must live on its feature
   branch, not on INTEGRATION (if found, STOP: INTEGRATION is contaminated). Spec front-matter churn for
   other tickets is expected; their *code* must be absent.
3. **Migrations / data safety.** Diff the project's migration/schema path
   (`git diff origin/<TRUNK>..<INTEGRATION> -- <migrations-path>`). Empty → none. Otherwise list each new
   file, confirm it's **deliberate + data-safe**, that it will apply to prod at the deploy step, and that any
   table/column a dependent ticket needs already exists.
4. **Secrets — ONLY when `DEPLOY.prod` is a Cloudflare deploy.** Confirm the ship needs no new/changed prod
   secret. Reading is fine (`wrangler secret list` — names only). **Never** put/delete/rotate a secret during
   ship (the "secrets are sacred" rule). Skip this check entirely for non-Cloudflare deploys.
4a. **Registers.** If the project has `tools/check-registers.py`, run it on INTEGRATION; a failure is a NO-GO.
   Report the open-items summary's "as of" date. A summary older than the newest shipped doc change is a flag
   for the walkthrough. Register ids on a published page are caught by the cloud build (assertion 8).
5. **Deps.** Each ship ticket's `deps` are `<TERMINAL>` or already on TRUNK; flag any that depend on an
   unshipped ticket and state whether it's functionally satisfied.
6. **Walkthrough + GATE.** Present, per feature, what lands now and the migration / (Cloudflare) secrets
   verdicts and any flagged risks. **Get explicit go-ahead before proceeding to the Procedure.**

## Step 0c — Acquire exclusive locks (after the GO/NO-GO gate, before any git mutation)
After the human gives go-ahead, acquire the ship locks — **in this order**. These prevent two sessions from
shipping simultaneously. Call them directly on their **own lines, NEVER inside `$(...)`** — Ctrl-C must be
able to bail without leaving a dangling subshell:

```
bash tools/spec-coord/coord.sh acquire branch:<TRUNK>
bash tools/spec-coord/coord.sh acquire prod          # only if DEPLOY.prod is set
```

Acquire `prod` only when `DEPLOY.prod` is set (no prod deploy ⇒ skip the `prod` lock). If a call blocks
(another session holds the lock), wait — do NOT kill the other session. When held, proceed to the Procedure.

**On any failure during the Procedure** (a refused push, a failed deploy, a red CI run) release the locks
in **reverse** order before stopping, and say in the report which of the two pushes landed:

```
bash tools/spec-coord/coord.sh release prod          # only if you acquired it
bash tools/spec-coord/coord.sh release branch:<TRUNK>
```

## Procedure — flip, merge, push INTEGRATION, push TRUNK
1. **feature → INTEGRATION (only if needed).** For a `pending-review` ticket, rebase its `<FEATURE><slug>`
   onto INTEGRATION, `git merge --ff-only` it into INTEGRATION, push INTEGRATION (if `origin`). For a ticket
   already in `testing` this was done at `/spec-test` — skip. Skip it too when INTEGRATION already contains
   the branch, which it will for anything that came through `/spec-swarm`. (When `INTEGRATION === TRUNK` the
   promotion collapses into this step: there is no second branch to merge, only the pushes.)
2. **Flip the board on INTEGRATION, before anything is pushed or published.** A **direct edit** (you are the
   only writer in this session, so it is race-free). For each shipped ticket, in ONE commit, edit
   `<SPECS>/<PREFIX>-NNN-*.md` to:
   - set `status: <TERMINAL>`,
   - set `branch: <TRUNK>` (terminal ⟺ on the trunk; the feature branch is deleted; a ticket whose
     `branch:` already reads `<TRUNK>` has shipped before, so drop it from the set instead of re-shipping),
   - append an **outcome record** to `## Notes` (shipped date + PR # if any + a 1-line what/why — a
     permanent, Claude-indexable design-decision record, never deleted),
   - append a **publish note**, separate from the outcome record and from any approval line already there:
     the date, the PR # if any, whether `docs.buildCommand` ran, and **how this is about to publish** (the
     push to `<TRUNK>`, or `<DEPLOY.prod>`, or "no prod deploy configured"). Three different questions get
     asked of a shipped ticket later ("was it approved?", "what did it do?", "did it actually publish?"),
     and one merged paragraph answers none of them cleanly.

   Then `git add "<SPECS>"` and commit (`spec: ship <PREFIX>-NNN`). **Do not push yet.** The next step is
   what makes that push legal, and pushing INTEGRATION here is exactly the refusal this ordering avoids.
3. **INTEGRATION → local TRUNK, still nothing pushed.** `git switch <TRUNK> && git merge --ff-only
   <INTEGRATION>`. A fast-forward, so TRUNK now carries the code and the flip and no merge commit exists to
   argue about. Skip when `INTEGRATION === TRUNK`. Nothing has published yet: no branch has left the
   laptop, and the deploy is caused by the TRUNK push in the next step.
4. **Push INTEGRATION, then TRUNK, as two separate pushes in that order.**
   ```
   git push origin <INTEGRATION>     # allowed: local <TRUNK> is ahead and carries the statuses
   git push origin <TRUNK>           # this is the publish
   ```
   The order is forced from both ends. CI's provenance job checks TRUNK's content against
   `origin/<INTEGRATION>`, so that ref has to be current first; and `pre-push` refuses a single push
   carrying both refs outright, because CI creates a run per ref unreliably when one push updates several.
   Expect the hook to print `check:board`'s refusal and then allow the push: that is the staged-push window
   reporting a two-step decision, not a contradiction. **A direct push to TRUNK is the supported flow.**
   `tools/githooks/setup-branch-protection.sh` blocks deletion and force-push and nothing else, so no PR is
   required by the kit.
   - **Where the team requires review**, the PR replaces the TRUNK push and reorders the rest: skip step
     3's local merge, push INTEGRATION with `ALLOW_BOARD_DRIFT=1` (nothing has reached `origin/<TRUNK>`
     yet, so the staged window cannot help and the board is knowingly ahead), then
     `gh pr create --base <TRUNK> --head <INTEGRATION>` and `gh pr merge <#> --merge`. The head must be
     INTEGRATION itself, never a feature branch, or CI's `source-is-integration` job refuses the deploy.
     Afterwards `git fetch origin && git switch <TRUNK> && git merge --ff-only origin/<TRUNK>` so the
     local trunk matches again. Report the override and the window; that is the whole price of this
     variant.
   - **No origin (local-only)**: the merge in step 3 is the whole promotion. Drop both pushes and say in
     the report that nothing was pushed, so nobody assumes a remote has it.
5. **Production deploy — only when `DEPLOY.prod` is set, run from TRUNK.** **Where `.github/workflows/ci.yml`
   was scaffolded, the TRUNK push in step 4 already started it**: watch that run (`gh run watch`) rather
   than deploying a second time, and treat a red `verify` as a failed ship. Where there is no pipeline (no
   GitHub remote, or the workflow was skipped at init), run the deploy from here. If the project has the
   **`/deploy`** skill installed (it is scaffolded whenever `deploy.prod` is set), invoke that rather than
   the raw command: it carries the trunk/clean/in-sync preflight and the post-deploy verification. Where it
   is absent, run `<DEPLOY.prod>` from the repo root. Either way it applies any unapplied prod migrations
   (already proven on staging at `/spec-test`; prod migrations stay **deliberate + data-safe**) and deploys
   the production target stamped with the real commit.
   - **If `<DEPLOY.prod>` is a Cloudflare deploy**, honor the global rules: re-export the suffixed
     `CLOUDFLARE_*_<ACCOUNT>` creds to the unsuffixed names **scoped to the deploy shell only** (never
     persisted, never in `wrangler.toml`/dotenv, never echoed); never put/delete/rotate a secret. For other
     deploy targets, just run the command.
   - **Verify it landed** (the deploy's health/version check shows the merged commit).
   - **If `DEPLOY.prod` is `null`** there is no deploy step — the code is on TRUNK; say so and move on.
   - **Native (`ios`) tickets do NOT reach users from a web/prod deploy** — they ship to the App Store only
     via a separate, owner-gated iOS Archive (not done here). If a ship ticket has an `ios` impact, say so
     explicitly in the report.
6. **Record the outcome, clean up, release the locks.** The publish note written in step 2 says how the
   ticket was about to publish; now say how it went. Append the result (the CI run's conclusion, or the
   deploy command's, or the verification you ran) to that same note and commit it on INTEGRATION
   (`spec: publish outcome <PREFIX>-NNN`), pushing it if a remote exists. **This commit touches no
   `status:` line**, so it is free of every gate the flip had to satisfy: `check:board` compares statuses
   and has nothing to say about a note. A ship whose deploy FAILED records that, in the same place, and the
   report leads with it.

   Then delete the shipped feature branch(es) (`git push origin --delete <FEATURE><slug>` if `origin`;
   `git branch -d <FEATURE><slug>`). INTEGRATION and TRUNK already match after step 3's fast-forward, so
   there is nothing to sync back; where the PR variant put a merge commit on TRUNK instead, fast-forward
   INTEGRATION onto it (`git switch <INTEGRATION> && git merge --ff-only origin/<TRUNK> && git push origin
   <INTEGRATION>`). Run `bash tools/spec-coord/coord.sh clean` to prune leftover worktrees + dangling
   `worktree-agent-*` refs.

   **Local-only repos (no `origin`)** take the same path with the pushes dropped: the merges are local
   fast-forwards, there is no PR, `git push origin --delete` is replaced by `git branch -d`, and the board
   is simply the committed state of INTEGRATION. Say in the report that nothing was pushed, so nobody
   assumes a remote has it.

   Then **release the locks (reverse acquire order):**
   ```
   bash tools/spec-coord/coord.sh release prod          # only if acquired
   bash tools/spec-coord/coord.sh release branch:<TRUNK>
   ```
7. **Refresh the recap.** Run **`/spec-recap`** so `<SPECS>/RECAP.md` reflects what just shipped. It reads
   the tickets in their final state, so this belongs after step 6, not before. It needs no lock, which is
   why it sits outside them.

## Optional hotfix fast-path (driven by `hotfix: true` on the ticket)

A ticket carrying **`hotfix: true`** in its front-matter may **skip the staging/`testing` hop**: promote it
straight `feature → INTEGRATION → TRUNK` from `pending-review`. The fast-path skips the *staging hop* and
nothing else: not the flip in step 2, not the push order in step 4, not the review the team requires. The
flag is the whole trigger. It does not depend on `SIM`, and it is available on any profile that has a
staging hop to skip.

**`SIM` restricts this path, it does not enable it.** When `SIM.enabled` and the ticket's `impacts`
intersect `SIM.triggerImpacts[]`, the fast-path is **forbidden** whatever the flag says: those surfaces
keep the full staging + sim-sign-off / data-safe-migration gates. STOP and route the ticket through
`/spec-test` + `/spec-sim-test` like any other gated ticket.

Two limits, because a hotfix is exactly where someone reaches past a gate that mattered:

- **A project with no staging hop has nothing to skip.** When `testing` is absent from `LIFECYCLE` and
  `DEPLOY.staging` is `null` (the `simple` profile), `hotfix: true` changes nothing in this procedure. It
  stays a board tag recording why the change went out fast.
- **It never skips anything else.** Not the Preflight, not the pre-ship review gate, not a data-safety
  check on a prod migration, not a human sign-off. The time saved comes out of the staging round-trip and
  nowhere else.

## Report
Tightly: which tickets/commits shipped, the PR # (if any, merged), the prod deploy result (or "no prod
deploy configured"), branches deleted, **that both pushes landed so the flip reached `origin/<TRUNK>`**, and
that the recap was refreshed. If the TRUNK push or the deploy did not happen, the report leads with that
and says the board is ahead of what the audience has. When this report is delivered, run:
`bash tools/spec-coord/coord.sh session-end`.

## Guardrails
- **The flip and the publish are one operation.** Flip on INTEGRATION, fast-forward TRUNK, push INTEGRATION,
  push TRUNK, all in this session. A terminal status whose flip never reached `origin/<TRUNK>` is a claim
  nobody can check, and it refuses every INTEGRATION push after it. If you cannot finish the sequence now,
  leave the ticket where it is and say so. (`in-progress` is the exception — set at the start of work.)
- **Never** force-push a shared branch, never `-D` an unmerged branch, never `git add -A` past unexpected
  files. **TRUNK = rollback** — if anything looks off, redeploy from TRUNK.
- **Secrets are sacred (Cloudflare deploys only):** read-only `wrangler secret list` is fine; never
  put/delete/rotate a secret during ship. For non-Cloudflare deploys these rules don't apply.
- The INTEGRATION→TRUNK merge + prod deploy are pre-authorized by invoking this on a confirmed feature — but
  report each. Status flips are direct edits on INTEGRATION; the feature branch never touches its own spec.

## Closing
`coord clean` and releasing the locks (both end of Procedure step 6) are part of the Procedure, and so is
the recap refresh (step 7). After the report, `bash tools/spec-coord/coord.sh session-end` ends the beacon
started in Step 0a.

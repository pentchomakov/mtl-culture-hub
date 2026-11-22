---
name: spec-start
description: >
  Begin work on a backlog ticket — review the board, create its feature branch, mark it in-progress, and
  implement it specifically. Use when the user says "start <PREFIX>-007", "begin work on <ticket>", "let's
  build <feature>", or "/spec-start <id>". Opens the spec board first, branches the feature off the
  integration branch, records status/branch on the INTEGRATION branch (not the feature branch) via a direct
  edit, derives a task checklist from the ticket, and implements + self-verifies per its `impacts` — ending
  in pending-review awaiting the user's test. Isolates into a worktree when another session is live. For UI
  work it can optionally validate the design as an interactive Claude Artifact before pending-review.
argument-hint: "<PREFIX>-NNN (id or slug)"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite, Artifact, AskUserQuestion
---

# spec-start — open a ticket for work

Implements a single ticket **specifically**: plan → execute → verify against Acceptance. Eligible tickets
are `status: backlog` (human-approved). Never start a `proposed` AI ticket — approve it first
(`/spec-approve`).

This skill is **config-driven**. It carries no hard-coded prefix, branch name, or surface — everything
project-specific is read from `spec-kit.config.json` at the repo root.

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

Throughout: **PREFIX** = `prefix`, **SPECS** = `specsDir`, **PROFILE** = `profile`, **IMPACTS** =
`impacts[]`, **LIFECYCLE** = `lifecycle[]`, **DEPLOY** = `deploy` (`{ staging, prod }` shell commands; may be
null), **SIM** = `simSignoff`. INTEGRATION is the branch where ticket status lives; FEATURE prefixes the
per-ticket work branch; the terminal lifecycle status is `shipped`.

## Steps

1. **(Optional) Beacon.** To show this work on the board and warn about concurrent sessions, run
   `bash tools/spec-coord/coord.sh session-begin "<PREFIX>-NNN" "spec-start"` (advisory; self-heals dead
   sessions). Skip for a quick solo run.
2. **Review the board.** Invoke the `/spec-board` skill so the user can eyeball the backlog. If an id was
   given, still open the board, then go to step 3.
3. **Resolve the ticket.** Match the arg to `<SPECS>/<PREFIX>-NNN-*.md` (by id or slug). If none/ambiguous,
   list `backlog` tickets and ask which. Read its `impacts`, Requirements, and Acceptance in full.
   **Then open the matching standard**, when `docs/reference/` exists and the ticket specifies anything
   built (a pipeline, a data layer, an app, an API, a dashboard, a schema): the application-development
   standard for app, API and frontend work, the data-engineering standard for pipelines, models and
   naming, both when the ticket spans the two. Say which one you opened and why, so the plan in step 7 is
   held to it rather than to a convention invented for this ticket. Skip this when `docs/reference/` is
   absent, and say so.
4. **Preflight.** Working tree clean; confirm `deps` are satisfied (each dep `<PREFIX>` id is `shipped`,
   the terminal lifecycle status); if not, surface it and stop. Don't start a ticket already
   `in-progress`/`pending-review`/`shipped` (or `testing`, when in the lifecycle) without confirming.
5. **Flip status + record the branch + stamp `who:` (direct edit on INTEGRATION).** Switch to
   **INTEGRATION** (`git switch <INTEGRATION>`; pull if an `origin` exists). Single session ⇒ you're the
   only writer, so this is race-free — no lock. Edit `<SPECS>/<PREFIX>-NNN-*.md`: set `status: in-progress`,
   `branch: <FEATURE><slug>`, and **append the starter's GitHub login to `who:` if it isn't already there**
   (`gh api user -q .login`, falling back to a lowercase-hyphenated `git config user.name`). Then
   `git add` the spec + commit (`spec: <PREFIX>-NNN → in-progress`) + `git push origin <INTEGRATION>`
   **if** an `origin` remote exists (local-only repos skip the push).
6. **Create the feature branch (worktree-isolate only when another session is live).** Check
   `bash tools/spec-coord/coord.sh status`. 
   - **No other live session** → `git switch -c <FEATURE><slug>` off the current INTEGRATION tip and do all
     the work right here in the primary checkout.
   - **Another session is actively using this checkout** → isolate instead: create a worktree under
     `.claude/worktrees/<PREFIX>-NNN` (`git worktree add .claude/worktrees/<PREFIX>-NNN <FEATURE><slug>`),
     or use the harness's `Agent` `isolation: "worktree"`, and do the work there. `coord clean` removes it
     afterward. (`coord.worktreesDir` in config names the sibling root if you prefer `<name>-worktrees/`;
     `coord clean` prunes both `.claude/worktrees/*` and `*-worktrees/*`.)
   - **The feature branch must never edit its own ticket's front-matter** — it carries code only (avoids
     `<SPECS>/` merge conflicts on feature→INTEGRATION).
7. **Plan.** Derive an ordered task checklist from Requirements; create a `TodoWrite` todo per task. Surface
   any ambiguity before writing code. **Consult the docs** to ground the plan in how the touched subsystem
   actually works (architecture, schema, API, conventions) — use the project's docs-lookup skill if present,
   else read the relevant files under the configured docs dirs.
8. **Execute** task-by-task, marking todos. Honor any cross-surface parity rules in `CLAUDE.md` (e.g. a
   shared web/native layer where one edit covers multiple `impacts` — flag any native glue and whether a
   rebuild is needed).
9. **Offer an interactive design preview (frontend/UI work) — OPTIONAL, the user's call.** When the ticket
   builds a **new** UI component or **meaningfully changes** an existing one (layout, a new modal/screen, a
   reworked interaction) **and** a frontend-class surface is in `impacts`, **ask** the user whether they'd
   like to validate the look-and-feel as a **Claude Artifact** first — a self-contained, clickable HTML
   mockup they can iterate on *while it's in progress*, before integration. Don't assume — it's per-ticket
   and skippable. **Skip the offer** for non-visual tweaks (copy, a prop, a no-visual-change bugfix) and for
   backend / data / native-only work. If the user opts in:
   - Build it **faithful to the project's design system**: replicate the app, don't invent a look. For a
     spec-kit project that means the **Compass Design Library**, concretely:
     - the tokens at `tools/docs-site/src/styles/cdl-tokens.css` (synced from the registry by
       `npm run sync:cdl`), plus any theme overlay in `tools/docs-site/src/themes/*.css` that
       `branding.theme` names;
     - the **`cdl-use`** skill for the component vocabulary (the shell, the page header, `CdlTabs`), so the
       preview uses the same names the real component will;
     - shadcn **new-york** + **Phosphor** icons, and the Tailwind v4 `@theme` idiom.
     Read those files rather than eyeballing the running app: a preview built on invented tokens validates
     a design that cannot then be implemented.
   - **Layout:** the **spec id + title** up top, a short description of what's shown / what changed, then the
     interactive design below. Pick a favicon that fits the project. Publish with the Artifact tool and
     **edit → re-publish to the SAME url** to iterate quickly.
   - **This gates step 11:** when a preview is used, the ticket does **not** advance to `pending-review`
     until the **design is to the user's liking** — iterate on the artifact until they sign off, *then*
     implement/finish the real component to match.
10. **Verify each Acceptance bullet with evidence, driven by `impacts` + `profile`:**
    - **Deployable surfaces** (frontend/backend/data, per this project's `impacts`) → if `PROFILE` is
      `full`/`ios` and `DEPLOY.staging` is set, build + run `DEPLOY.staging` and exercise the change against
      the staging target. For a data/schema impact, confirm the migration is **backwards-compatible** before
      applying. For `simple` profiles with no deploy, run the build + local app / test suite as evidence.
    - **`ios`** (when in `impacts` and `PROFILE: ios`) → build on the iPhone simulator via the project's
      **`/spec-sim-test`** skill and drive the relevant flow. (Real-device APNs/IAP/Apple checks stay
      manual.)
    - Never claim done on a green build alone — exercise the actual behavior.
    - **Documentation surfaces** (any change under `docs/`, `templates/` or `playbook/`) → the register pass in
      `docs/delivery/registers/README.md` has run for the change, and `python3 tools/check-registers.py`
      passes. Its `--changed-since <INTEGRATION>` advisory names any doc change the registers did not follow;
      confirm each one needed nothing.
11. **End in `pending-review`.** First push the feature branch if an `origin` exists
    (`git push -u origin <FEATURE><slug>`). Then flip the ticket by a **direct edit on INTEGRATION**:
    `git switch <INTEGRATION>`, set `status: pending-review` in `<SPECS>/<PREFIX>-NNN-*.md` (a value from
    LIFECYCLE, never one outside it: the board's columns are that array, so an off-list status makes the
    ticket vanish), `git add` +
    commit (`spec: <PREFIX>-NNN → pending-review`) + push to `origin <INTEGRATION>` if a remote exists — for
    a UI ticket where a design preview was used, only **after** they've signed off on the artifact. Tell the
    user the branch is ready and what comes next for this profile:
    - `full`/`ios`: run **`/spec-test <PREFIX>-NNN`** to deploy it to the staging stage (→ `testing`); if
      `SIM` applies to this ticket's impacts, your iPhone-sim sign-off is also required. After the user
      confirms, **`/spec-ship`** promotes INTEGRATION → TRUNK and sets it `shipped`.
    - `simple`: it's ready for the user's review on the feature branch; **`/spec-ship`** promotes it to
      TRUNK and sets it `shipped`.

## Guardrails
- One ticket → one `<FEATURE>*` branch. Status flips and the `who:` stamp are **direct edits on
  INTEGRATION** (commit + push when a remote exists). The **feature branch never touches its own ticket's
  front-matter**: not `status:`, not `branch:`, not `who:`, not a note. It carries code only. This is the
  single rule that keeps `<SPECS>/` conflict-free on every feature→INTEGRATION merge, and it is worth more
  than the small convenience of editing the ticket where you happen to be standing.
- Respect the branching strategy in `spec-kit.config.json` + `CLAUDE.md` (verify before merging; TRUNK is
  the rollback line; feature branches deploy to **staging**, never prod).
- **Worktree-isolate only when `coord status` shows another live session** — otherwise build on the feature
  branch directly. Don't reach for heavy locks here; spec-start relies on direct edits + worktrees.
- **Design preview is opt-in, never forced.** Only offer the Artifact mockup for genuine UI build/redesign
  work, and only build one if the user says yes. When used, it's an in-progress design gate (before
  `pending-review`) — iterate to the user's liking, then implement to match. It is a validation aid, not a
  substitute for the real component or the staging verification in steps 10–11.
- Honor the secrets / deploy-account rules in `CLAUDE.md`.

## Closing
When the skill completes (ticket flipped to `pending-review`, branch pushed, user told what's next):
1. `bash tools/spec-coord/coord.sh clean` — removes any isolation worktree you created + dangling
   `worktree-agent-*` scaffold refs + dead sessions. (It skips a worktree with tracked uncommitted changes
   and never deletes a `<FEATURE>*` branch.)
2. If you started a beacon in step 1, `bash tools/spec-coord/coord.sh session-end`.

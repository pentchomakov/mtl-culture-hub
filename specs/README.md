# Feature library (`specs/`)

Every feature/fix is a ticket: one markdown file `MCH-NNN-<slug>.md` with YAML front-matter. This is
the place to **paste or refine a spec** — Claude reads these directly, and the read-only board in
[`tools/spec-board/`](../tools/spec-board) renders them. **Spec-driven development is the default way to
build mtl-culture-hub.** Tickets are kept **forever** (even shipped ones) as a Claude-indexable record of what we
built and why.

> This project was initialized with the portable **Spec Kit** (`/spec-init`). Project-specific settings —
> the id prefix, impact taxonomy, lifecycle, branch model, and deploy commands — live in
> [`spec-kit.config.json`](../spec-kit.config.json) at the repo root. The global `spec-*` skills read it.

## Front-matter

```yaml
---
id: MCH-007         # unique, zero-padded; next = highest + 1
title: Short human title
status: backlog            # backlog | in-progress | pending-review | shipped  (+ proposed | rejected for AI ideas)
impacts: [frontend]   # MANDATORY, non-empty: which surfaces this touches (see below)
who: []                    # GitHub logins who have touched this ticket
source: human              # human | ai | annotation
branch:                    # set by /spec-start (blank in backlog)
deps: []                   # other MCH ids this depends on
created: 2026-11-22
# paths: []                # optional: what this ticket gates on deploy (see below)
# hotfix: true             # optional: skips the staging hop (see below)
---
```

### `impacts:` — the authoritative impacted-surfaces axis
**Mandatory, and never empty.** This drives verification and (when configured) the ship gates, and it is
the axis the board filters on, so a ticket without it is invisible to both. This project's surfaces are:

- `frontend` — the UI: pages, components, styling, the CDL app shell.
- `backend` — server-side logic, APIs and integrations.
- `db` — schema, migrations and data access.

### `who:` — the GitHub logins that touched this ticket
A list, appended to over the ticket's life. `/spec-new` stamps the creator's login
(`gh api user -q .login`, falling back to a lowercase-hyphenated `git config user.name`). The
orchestrating skill appends each worker's login when it flips status on `develop`. Because
every append happens on the integration branch, a **feature branch never edits its own ticket's
front-matter**, and `specs/` stays conflict-free across parallel work.

### `paths:` — what this ticket gates on deploy
An explicit list of the doc or app paths whose presence in the published bundle proves this ticket really
shipped. It is read by the deploy-time status gate (`docs.statusGating`): a ticket claiming a
`requireOnDeploy` status whose `paths:` are missing from the bundle **fails the build** rather than
publishing a surface the board says is live.

`paths: []` is a real, deliberate answer: it means *this ticket gates nothing*. Use it for a refactor, a
tooling change, or anything with no published surface, and write the empty list rather than omitting the
key, so a reader can tell "nothing to gate" from "nobody thought about it".

### `hotfix: true`
Optional flag for a change that skips the staging hop. `/spec-ship` reads it and promotes the ticket
straight to `main` without the staging round-trip, and the flag alone is the trigger. It never skips
anything else: not the pull request, not the pre-ship review, not a prod-migration safety check, and not a
sign-off gate. Where a project configures a sign-off gate (`simSignoff`), a ticket whose `impacts` fall
under that gate cannot use the fast-path at all, flag or no flag. And where the project has no staging hop
to begin with, there is nothing to skip: the flag is then purely a record.

Either way it is a filterable tag on the board, so a run of hotfixes is visible as a pattern rather than
buried in the history of individual tickets.

### `status:` — lifecycle
Status flows through the configured lifecycle:

`backlog → in-progress → pending-review → shipped`

plus `proposed` / `rejected` for AI-authored ideas (see `source:`). Status is tracked on the **integration
branch** (`develop`): each flip is a **direct edit** to the ticket's `status:` line on
`develop`, committed there by the orchestrating skill — so the board is a live kanban across
every parallel feature branch. **Feature branches carry code only** (they never edit their own ticket's
front-matter), which avoids `specs/` merge conflicts. The thin coordinator (`tools/spec-coord/`)
provides session beacons + narrow locks + `clean`; it does not own status — status is just a committed edit.

| status | git location |
|---|---|
| `backlog` | `specs/` on `develop` |
| `in-progress` | `specs/` on `develop`, code on the `feat/<slug>` branch |
| `pending-review` | `specs/` on `develop`, code on the `feat/<slug>` branch awaiting review |
| `shipped` | `specs/` on `develop`, code merged to `develop` and `main` |

### `source:` — where the ticket came from
`human` (default) tickets are first-class and always lead. `ai` tickets come from `/spec-ideate`; they land
as `proposed`, render in a separate "Proposed by Claude" panel, and are **never** built until you run
`/spec-approve` (which flips them to `backlog`). Rejected proposals become `rejected` and stay for history.
`annotation` tickets were raised from a review annotation left on the portal itself: same first-class
standing as `human` (a reviewer asked for them), with the provenance kept so the board can show which
feedback round produced which work.

## Body sections
`## Summary` · `## Requirements` · `## Acceptance` · `## Notes`

## Filtering the board
The board's **Tags** panel filters on `impacts`, `who` (shown only once more than one distinct login
appears across the tickets), and the flags (`source: ai`, `source: annotation`, `requires_sim_signoff`
shown as `sign-off`, and `hotfix`), plus any project-specific axis this project adds. Any tag within a
family matches, and every family carrying a selection must match. `status:` is not a filter, because it
is already the columns.

Values come from the tickets themselves, so a mistyped tag shows up as its own stray button rather than
being silently folded into the right one. That is the cheapest typo detector in the system: use it.

## Recap
`specs/RECAP.md` is the rolling exec summary of the project's live state: **Now** (in flight),
**Just done** (roughly the last working day's worth of work), **Next** (deps-ready backlog, ordered). The
board's **Summary** button renders it, with a Copy button that puts the raw markdown on the clipboard, so
a status update is a paste rather than a rewrite.

It is **generated content**. `/spec-recap` overwrites it whole from ticket front-matter, `git log` on
`develop`, and the coordinator's live sessions. Do not hand-edit it: run the skill, and if
the recap is wrong, the fix is in the tickets it read.

## Lifecycle (skills)
1. **`/spec-new`** — a description → one ticket; a big requirements dump → brainstorm + decompose into many
   independent tickets. Assigns the next id (collision-proof under the integration-branch lock), infers
   `impacts`, drafts sections.
2. **`/spec-ideate`** *(optional, autonomous)* — proposes `source: ai` / `status: proposed` tickets;
   **`/spec-approve`** promotes the ones you want to `backlog`.
3. **`/spec-board`** — open the read-only kanban to review (with the live multi-session strip).
4. **`/spec-start <id>`** — create `feat/<slug>` off `develop`, flip status, plan → execute →
   verify, end in `pending-review`. Concurrent sessions auto-isolate into a worktree.
5. **`/spec-swarm`** — build many independent backlog tickets in parallel, each on its own branch.
6. **`/spec-recap`** — rewrite `specs/RECAP.md` from the live state of the board.
7. **`/spec-ship <id>`** — merge the reviewed branch and flip to `shipped`. This profile has no deploy or simulator sign-off gate.

Status is tracked in git (the front-matter on `develop`) — no external tracker. Multi-session
coordination (locks, worktrees, the live board strip) is provided by `tools/spec-coord/` — see its README.


## Loopable skills

A skill is **loopable** (safe under `/loop /<skill>`) when it satisfies all five:

1. **Idempotent re-entry**: it re-reads `spec-kit.config.json` at the top of every iteration.
2. **Self-selecting work queue**: it derives its next batch from ticket state, so re-invocation advances
   instead of repeating.
3. **A hard human stop inside the loop**: any human gate (approval, sign-off) halts and hands back; the
   skill never self-approves.
4. **Self-cleanup each pass**: it ends with `coord.sh clean` and `session-end` so iterations do not
   accumulate worktrees or beacons.
5. **Self-pacing**: it does its next unit of work at a natural boundary rather than assuming a fixed
   interval.

`/loop` is a Claude Code CLI built-in: universally available, zero install. The pairings that hold:
`/loop /autopilot`, `/loop /spec-swarm`, `/loop /spec-ideate`, `/loop /spec-recap`.

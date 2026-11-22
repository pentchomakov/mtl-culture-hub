---
name: spec-board
description: >
  Open the read-only spec board — the local kanban that renders the project's spec tickets by status
  (the configured lifecycle: backlog / in-progress / pending-review / [testing] / shipped), impact chips
  (the project's impacts taxonomy, e.g. frontend / backend / db / ios), and the AI-proposed panel, with a
  LiveStrip of active sessions, locks, and worktrees. Use when the user says "open the board", "show the
  backlog", "spec board", "what's in the backlog", or "/spec-board". Also invoked first by /spec-start so
  the user can review before picking a ticket. Boots the Vite dev server in the background and opens it in
  the browser; never mutates anything.
argument-hint: ""
allowed-tools: Bash, Read
---

# spec-board — open the read-only backlog viewer

Launch `tools/spec-board/` (Vite + React; reads `<specsDir>/` via a front-matter plugin and hot-reloads as
tickets change). It is **read-only** — it never edits tickets or git. It renders tickets grouped by the
project's configured `lifecycle`, chips them by the project's `impacts` taxonomy, and shows a **LiveStrip**
of `{ sessions, locks, queue, worktrees }` from the coordinator that hides itself when everything is empty.

## The Tags panel

The **Tags** button in the toolbar opens a filter panel with one row per tag family:

| Family | Values | Shown |
|---|---|---|
| `impacts` | the project's `impacts[]` taxonomy | always |
| `who` | the GitHub logins in the tickets' `who:` lists | only when more than one distinct login appears across the tickets |
| flags | `source: ai`, `source: annotation`, `requires_sim_signoff` (shown as `sign-off`), `hotfix` | when any ticket carries one |
| project axes | any additional front-matter axis this project defines | when present |

**Any tag within a family matches; every family carrying a selection must match.** So "Ana's UI work" is
`Who: ana-lopez` + `Impacts: frontend`. It composes with the search box and the created-date buttons.

`status:` is deliberately **not** a filter: it is already the columns.

Values come from the tickets themselves, so a mistyped tag appears as its own stray button rather than
being folded into the right one. Point the user at the panel when they ask to see one person's work, or one
surface across the whole board: that beats reading every column.

## The Summary button

**Summary** opens the rendered `<specsDir>/RECAP.md` in a modal, with a **Copy** button that puts the raw
markdown on the clipboard, so a status update is a paste rather than a rewrite. The recap is generated
content kept current by **`/spec-recap`**: if it looks stale, run that skill rather than editing the file.
Nothing in this board writes it.

## Step 0 — Config + tool guard (do this first)
1. Read **`spec-kit.config.json`** at the repo root. If it is missing, this project hasn't been initialized
   — tell the user to run **`/spec-init`** and stop. Note `name`, `specsDir`, and `lifecycle` for the report.
2. If **`tools/spec-board/`** is absent, the board viewer isn't scaffolded — tell the user to re-run
   `/spec-init` (repair mode restores it) and stop.

## Steps
1. **(Optional) Beacon.** You may run `bash tools/spec-coord/coord.sh session-begin "" "spec-board"` to
   register this session on the board's LiveStrip (advisory; reaps dead sessions). The board is read-only,
   so this is purely cosmetic — skip it if you just want to view. The strip shows
   `{ sessions, locks, queue, worktrees }` (worktrees = live non-primary checkouts during parallel work).
2. **Already up?** Check `lsof -i:5173 -sTCP:LISTEN` (Vite's default). If something's listening, the board
   is probably already running — just `open http://localhost:5173` and stop.
3. **Deps.** If `tools/spec-board/node_modules` is missing, run `npm install` in `tools/spec-board/`.
4. **Start (background).** From `tools/spec-board/`, run `npm run board` with `run_in_background: true`
   (it's a long-lived dev server — never run it in the foreground, it won't return).
5. **Find the real URL.** Read the background process output for the `➜  Local:   http://localhost:PORT/`
   line — Vite bumps to 5174+ if 5173 is busy. Use that exact URL.
6. **Open + report.** `open <URL>` (macOS). Tell the user the board is live, read-only, and hot-reloads as
   `<specsDir>/` changes. Leave the server running in the background.

## Guardrails
- Read-only: do not edit tickets, run git, or deploy from this skill. (Status flips happen elsewhere as
  direct edits on the integration branch — never from here.)
- Don't spawn a second server if one is already serving the board (step 2).

## Closing
If you started a beacon in step 1, run `bash tools/spec-coord/coord.sh session-end` when done (the board
server keeps running in the background). The board is read-only, so do **not** run `coord clean` from here.

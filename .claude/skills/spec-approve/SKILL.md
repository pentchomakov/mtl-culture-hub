---
name: spec-approve
description: >
  Approve or reject AI-proposed spec tickets — the human gate that lets a `proposed` idea become real,
  buildable backlog work. Use when the user says "approve <PREFIX>-012", "approve these proposals", "reject
  <PREFIX>-014", "accept the AI ideas", or "/spec-approve <ids>". Flips proposed→backlog (approve) or
  proposed→rejected (reject) on the integration branch. Nothing AI-proposed is ever built until approved here.
argument-hint: "<PREFIX>-NNN [<PREFIX>-NNN ...]  (or 'reject <PREFIX>-NNN ...')"
allowed-tools: Bash, Read, Edit, Glob, Grep
---

# spec-approve — gate AI proposals into the backlog

The owner's decision point for `source: ai` / `status: proposed` tickets. `/spec-start` and `/spec-swarm`
ignore `proposed` tickets, so this is the only path that makes an AI idea buildable.

## Step 0 — Read the config (required)
Read **`spec-kit.config.json`** at the repo root. If it is missing, the project isn't initialized — tell
the user to run `/spec-init` and **stop**. From it, bind:

- **`PREFIX`** = `prefix` — the ticket id prefix (e.g. `PAW`, `ACME`).
- **`SPECS`** = `specsDir` — where tickets live (e.g. `specs`).
- **`INTEGRATION`** = `branching.integration || branching.trunk` — the branch where ticket status lives.
- **`TRUNK`** = `branching.trunk` — the published line.
- **`LIFECYCLE`** = `lifecycle[]`, and **`GATED`** = `docs.statusGating.requireOnDeploy` (absent ⇒ empty:
  no status in this project claims an external surface). Read "The promotion IS the publish" below before
  flipping a ticket **into** any status in `GATED`.

## Steps
1. **(Optional) Beacon.** To warn about concurrent sessions, run
   `bash tools/spec-coord/coord.sh session-begin "<PREFIX>-NNN" "spec-approve"` (advisory; self-heals dead
   sessions). Skip for a quick solo run.
2. **Resolve the ids.** Match each arg to a `<SPECS>/<PREFIX>-NNN-*.md` that is `status: proposed`. If
   none given, list the current proposals (id · title · impacts · why) and ask which to approve/reject.
   Detect a `reject` keyword in the args to route to rejection.
3. **Apply any user-requested edits** (title, impacts, scope) to the spec file on INTEGRATION before
   flipping status, so the edits land in the same commit as the status change.
4. **Flip status by a direct edit on INTEGRATION** (`git switch <INTEGRATION>` if needed; status flips are
   direct edits to the spec markdown — single session = you're the only writer, race-free). Edit the
   ticket's `status:` line, then `git add "<SPECS>"` + commit (`spec: <PREFIX>-NNN → <state>`) + push to
   `origin <INTEGRATION>` **if an `origin` remote exists**:
   ```
   git add "<SPECS>"
   git commit -m "spec: <PREFIX>-NNN → <state>"
   git remote get-url origin >/dev/null 2>&1 && git push origin <INTEGRATION>
   ```

   **One exception to pushing immediately**: if the flip lands a ticket in a `GATED` status, the push
   waits until local `<TRUNK>` has been fast-forwarded onto the flip, because the pre-push hook checks the
   board against `origin/<TRUNK>`. Follow "The promotion IS the publish" below instead, which is that
   sequence in full. `proposed → backlog` and `proposed → rejected` are never gated, so the ordinary run
   of this skill pushes here and is done.

   **Approve** → `status: backlog` (keep `source: ai` for provenance + the board's AI badge).

   **Reject** → `status: rejected` (keep the file — it stays for history so `/spec-ideate` won't
   re-propose it; optionally note the reason in `## Notes` in the same commit).

   For multiple tickets, edit them all and commit together (or one commit each — either is fine).

   **Record who approved, and when.** Append one line to `## Notes` in the **same commit** as the flip:
   the approver's name or handle and the date (e.g. "Approved by @jsmith on 2026-03-04."). Take it from
   the user, or ask for it. **Never invent a name or a date**, and never write "approved" with no
   attribution: this line is the only durable record that a human made the call, and it is the first thing
   read when someone later asks why a ticket moved.

5. **Report** what moved where, and suggest `/spec-start <id>` or `/spec-swarm` for the freshly-approved set.

## The promotion IS the publish

Whenever a flip in this skill lands a ticket in a status listed in **`GATED`**
(`docs.statusGating.requireOnDeploy`), that status is **not a label. It is a claim that the deliverable is
visible on the external surface.** So the flip and the publish are one operation, in the same session:

```
edit status -> merge <INTEGRATION> into <TRUNK> -> push <INTEGRATION> -> push <TRUNK> (CI deploys) or run /deploy
```

The merge precedes both pushes, and the pushes go in that order, because the hook checks the board
against `origin/<TRUNK>` on every `<INTEGRATION>` push: with the flip already fast-forwarded onto local
`<TRUNK>`, the push is allowed. `/spec-ship` runs exactly this sequence for the terminal status.

**Never flip into a `GATED` status and stop.** If you cannot publish right now, leave the ticket where it
is and say so. A ticket parked one status short costs nothing; a board that claims work is live when it is
not makes the whole delivery record unusable, and nothing in the repo looks wrong afterwards, which is why
this one goes unnoticed for hours.

The mechanical backstop is **`npm run check:board`** (`tools/docs-site/scripts/check-board-matches-deploy.mjs`):
every ticket at a `GATED` status must carry that same status on `origin/<TRUNK>`. The pre-push hook
(`tools/githooks/pre-push`) runs the same check and refuses an `<INTEGRATION>` push that would leave the
board ahead of `<TRUNK>`. Both are backstops, not permission: `ALLOW_BOARD_DRIFT=1` exists for the case
where you genuinely mean it, and using it means saying so out loud in the report.

When `GATED` is empty or `docs.statusGating` is absent, none of this applies: no status in this project
asserts anything about a published surface.

## Guardrails
- Only act on `proposed` tickets. Don't silently promote — every flip is an explicit user decision.
- **Never invent an approver or a date.** No attribution, no flip.
- Never delete a ticket here (rejected stays for the archive + dedupe). Status flips on INTEGRATION only.
- There is **no coord command for status** — flips are direct edits + commit (+ push if `origin` exists).
- **Stage by path, not glob.** Always `git add "<SPECS>"` (a `<PREFIX>-*.md` glob errors under zsh when
  nothing matches).

## Closing
If you started a beacon in step 1, run `bash tools/spec-coord/coord.sh session-end` when done.

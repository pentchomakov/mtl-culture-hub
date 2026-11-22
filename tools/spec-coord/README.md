# spec-coord — thin multi-session coordinator

Portable, project-agnostic coordination for the Spec Kit. The single-session path needs none of it (status
flips are direct edits to your specs on the integration branch); coord exists only for cross-session safety
and cleanup. Carries no project config — the skills pass concrete lock names.

## Commands (`bash tools/spec-coord/coord.sh <cmd>`)
- `session-begin [ticket] [op]` / `session-end` — advisory heartbeat under `.git/spec-coord/sessions/`,
  auto-reaped when a process dies. Wired to Claude's `SessionStart`/`SessionEnd` hooks (see
  `.claude/settings.json`) so the board's live strip is honest.
- `acquire <resource> [timeout]` / `release <resource>` — atomic `mkdir` lock with blocking wait-and-queue +
  reentrancy. The skills use a handful: `spec-new-id` (collision-proof id assignment), and the deploy/build
  gates a project's profile defines (e.g. `staging`, `prod`, `sim`, `branch:<trunk>`).
- `status [--json]` — `{ sessions, locks, queue, worktrees }`; the board polls this for its LiveStrip.
- `clean` — prune git worktrees, remove clean throwaway worktrees (`.claude/worktrees/*`, `*-worktrees/*`),
  delete dangling `worktree-agent-*` scaffold refs, reap dead sessions. Skips dirty worktrees; never touches
  `feat/*`. Skills call it at the end of a run.

## Files
`coord.sh` (dispatch) · `lib/state.sh` (state dir) · `lib/session.sh` (heartbeats) · `lib/lock.sh`
(locks + queue) · `lib/clean.sh` (cleanup) · `lib/status.sh` (status + `--json`).

## Test escapes
`COORD_TEST_PID` lets the suite run without a real Claude parent process.

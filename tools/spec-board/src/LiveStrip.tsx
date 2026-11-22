import { useEffect, useRef, useState } from "react";

// ── Types matching coord.sh status --json output ─────────────────────────────

interface CoordSession {
  pid: number;
  start: string;
  tty: string;
  checkout: string;
  ticket: string;
  op: string;
  heartbeat: string;
}

interface CoordLock {
  resource: string;
  owner: number; // pid
}

interface CoordQueueEntry {
  resource: string;
  pid: number;
  position: number;
}

interface CoordWorktree {
  path: string;
  branch: string;
}

interface CoordStatus {
  sessions: CoordSession[];
  locks: CoordLock[];
  queue: CoordQueueEntry[];
  worktrees: CoordWorktree[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isEmpty(s: CoordStatus): boolean {
  return (
    s.sessions.length === 0 &&
    s.locks.length === 0 &&
    s.queue.length === 0 &&
    s.worktrees.length === 0
  );
}

/** Staging lock holder's pid, or null. */
function stagingHolder(s: CoordStatus): number | null {
  const lock = s.locks.find((l) => l.resource === "staging");
  return lock ? lock.owner : null;
}

/** Label for a session: "<TICKET> · op" or just pid. */
function sessionLabel(sess: CoordSession): string {
  const parts: string[] = [];
  if (sess.ticket) parts.push(sess.ticket);
  if (sess.op) parts.push(sess.op);
  return parts.length > 0 ? parts.join(" · ") : `pid ${sess.pid}`;
}

// ── Styling ───────────────────────────────────────────────────────────────────
//
// The strip's chrome is on tokens like the rest of the board; the pills stay chromatic,
// because green/amber/blue is what makes "running", "holding a lock" and "waiting"
// readable at a glance. Each chromatic class carries its dark counterpart.

const ROW_LABEL = "text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";
const PILL = "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium";
const PILL_RUNNING =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300";
const PILL_HOLDING =
  "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
const PILL_WAITING =
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300";

// ── LiveStrip component ───────────────────────────────────────────────────────

export function LiveStrip() {
  const [status, setStatus] = useState<CoordStatus | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    try {
      const res = await fetch("/coord-status", { signal: AbortSignal.timeout(2000) });
      if (!res.ok) {
        setFetchFailed(true);
        return;
      }
      const data: CoordStatus = await res.json();
      setFetchFailed(false);
      setStatus(data);
    } catch {
      // Dev server not running, coord not available, or static build: degrade silently.
      setFetchFailed(true);
    }
  }

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  // Degrade gracefully: endpoint not reachable (static build / no dev server)
  if (fetchFailed || status === null) return null;

  // Nothing live (no session, lock, queue, or worktree) → hide the strip entirely rather
  // than claim "no active sessions". With the SessionStart beacon hook a live session
  // normally registers; when nothing is registered, showing nothing is honest.
  if (isEmpty(status)) return null;

  const stagingPid = stagingHolder(status);

  return (
    <div className="border-b border-border bg-card px-4 py-2 text-[12px]">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-1.5">
        {/* Live sessions */}
        {status.sessions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={ROW_LABEL}>Live</span>
            {status.sessions.map((sess) => {
              const holdingStaging = stagingPid === sess.pid;
              return (
                <span
                  key={sess.pid}
                  title={`pid ${sess.pid} · tty ${sess.tty} · checkout ${sess.checkout}`}
                  className={`${PILL} ${holdingStaging ? PILL_HOLDING : PILL_RUNNING}`}
                >
                  <span className="font-mono text-[10px] opacity-60">{sess.pid}</span>
                  {sessionLabel(sess)}
                  {holdingStaging && (
                    <span
                      title="holds staging lock"
                      className="rounded-full border border-amber-300 bg-amber-100 px-1 text-[9px] font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    >
                      staging
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Locks not covered by a session pill above (non-staging, or staging when no sessions) */}
        {status.locks.filter((l) => l.resource !== "staging" || status.sessions.length === 0).length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={ROW_LABEL}>Locks</span>
            {status.locks
              .filter((l) => l.resource !== "staging" || status.sessions.length === 0)
              .map((lock) => (
                <span key={lock.resource} className={`${PILL} ${PILL_HOLDING}`}>
                  <span className="font-mono">{lock.resource}</span>
                  <span className="opacity-70">← pid {lock.owner}</span>
                </span>
              ))}
          </div>
        )}

        {/* Queue waiters */}
        {status.queue.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={ROW_LABEL}>Queued</span>
            {status.queue.map((w, idx) => (
              <span key={`${w.resource}-${w.pid}-${idx}`} className={`${PILL} ${PILL_WAITING}`}>
                #{w.position} <span className="font-mono">{w.resource}</span>
                <span className="opacity-70">pid {w.pid}</span>
              </span>
            ))}
          </div>
        )}

        {/* Live worktrees (parallel feat work in flight) */}
        {status.worktrees.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={ROW_LABEL}>Worktrees</span>
            {status.worktrees.map((wt) => (
              <span key={wt.path} title={wt.path} className={`${PILL} ${PILL_WAITING}`}>
                <span className="font-mono">{wt.branch || "(detached)"}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

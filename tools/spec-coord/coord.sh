#!/usr/bin/env bash
# spec-coord — thin coordinator (portable Spec Kit; derived from paw's PAW-115 thin-coord).
#
# The single-session path needs NO coordination: status flips are direct edits to <specsDir>/*.md on the
# integration branch. coord exists only for the few cross-session concerns + cleanup:
#   session-begin/-end  advisory heartbeat (so the board / spec-new can warn "another session is live")
#   acquire/release     narrow locks — used ONLY for spec-new id assignment + the staging/prod/sim gates
#   status              board LiveStrip data: { sessions, locks, queue, worktrees }
#   clean               prune worktrees + delete worktree-agent-* scaffold refs + reap dead sessions
#
# This layer is project-agnostic — it carries no prefix, specs path, or branch names. The skills read those
# from spec-kit.config.json and pass concrete lock names to acquire/release.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")" && pwd)
for f in state session lock clean status; do
  [ -f "$ROOT/lib/$f.sh" ] && source "$ROOT/lib/$f.sh"
done
cmd=${1:-help}; shift || true
case "$cmd" in
  session-begin) session_begin "$@";;
  session-end)   session_end "$@";;
  acquire)       lock_acquire "$@";;
  release)       lock_release "$@";;
  status)        coord_status "$@";;
  clean)         coord_clean "$@";;
  *) echo "usage: coord.sh {session-begin|session-end|acquire|release|status|clean}"; exit 2;;
esac

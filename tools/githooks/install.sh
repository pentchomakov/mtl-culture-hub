#!/bin/sh
#
# Install this repo's git hooks. Idempotent; run it again any time.
#
#   bash tools/githooks/install.sh
#
# `.git/hooks` is not versioned, so a hook only protects the checkout it is installed in. That
# is a real limit and worth stating rather than pretending otherwise: a teammate who has not run
# this, or a fresh clone, has no pre-push check. The checks themselves live in
# `tools/docs-site/scripts/` and are also wired into `predeploy` and into CI, so the deploy path
# is covered for everyone regardless.
#
# WHY COPY, NOT `core.hooksPath`. hooksPath would version the hooks properly, but it REPLACES
# the hooks directory wholesale, and Git LFS installs post-checkout, post-commit, post-merge and
# pre-push into `.git/hooks`. Pointing hooksPath elsewhere silently disables all four, which
# trades a board-accuracy bug for a broken LFS checkout. So: copy in, and chain to LFS from
# inside the hook.
#
# A pre-existing hook that is not ours is backed up rather than overwritten, because the one we
# would silently destroy is usually the one Git LFS just installed.

set -e

REPO="$(git rev-parse --show-toplevel)"
SRC="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

# `--git-common-dir` rather than `--git-dir`, so this works from inside a worktree: a worktree's
# own git dir has no hooks directory of its own, and hooks live in the common one.
COMMON="$(git -C "$REPO" rev-parse --git-common-dir)"
case "$COMMON" in
  /*) ;;
  *) COMMON="$REPO/$COMMON" ;;
esac
DEST="$COMMON/hooks"
mkdir -p "$DEST"

for hook in pre-push; do
  if [ -f "$DEST/$hook" ] && ! grep -q "tools/githooks" "$DEST/$hook" 2>/dev/null; then
    cp "$DEST/$hook" "$DEST/$hook.pre-speckit"
    printf 'backed up the existing %s to %s.pre-speckit\n' "$hook" "$hook"
  fi
  cp "$SRC/$hook" "$DEST/$hook"
  chmod +x "$DEST/$hook"
  printf 'installed %s\n' "$hook"
done

printf '\nhooks installed into %s. They chain to Git LFS, which still runs.\n' "$DEST"
printf 'Every other clone of this repo needs the same one-liner: bash tools/githooks/install.sh\n'

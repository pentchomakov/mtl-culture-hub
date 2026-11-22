#!/bin/sh
#
# Apply the third layer: the trunk's history is append-only, for everyone, with no bypass.
#
#   bash tools/githooks/setup-branch-protection.sh
#
# The other two layers stop a bad push (the pre-push hook, on the checkout that installed it) and
# a bad deploy (CI, for everyone). Neither can stop history being rewritten or the branch being
# deleted, and neither runs at all for a force-push from a web UI or a token. A GitHub ruleset
# does, server-side, with no bypass actors.
#
# What it creates: a branch ruleset named "<trunk>: history is append-only" with two rules,
# `deletion` and `non_fast_forward`. Nothing else. It deliberately does NOT require pull requests
# or status checks: those are a team policy decision, and a scaffolder that quietly makes them
# mandatory is a scaffolder people fight.
#
# Idempotent: if a ruleset already covers the trunk with both rules, it says so and exits 0.
#
# This offers, it does not insist. No `gh`, no authentication, no admin rights and no remote all
# print the manual steps and exit 0, because a scaffold must not fail on a permission the person
# running it may legitimately not have. It never reads, writes or echoes a token.

set -e

REPO="$(git rev-parse --show-toplevel)"
CFG="$REPO/spec-kit.config.json"
TRUNK="$(node -e "const b=require('$CFG').branching||{};process.stdout.write(b.trunk||'main')" 2>/dev/null || echo main)"
RULESET_NAME="$TRUNK: history is append-only"

manual() {
  printf '\n  Do it by hand, once, in the GitHub UI:\n\n'
  printf '    Settings -> Rules -> Rulesets -> New branch ruleset\n'
  printf '      Name:         %s\n' "$RULESET_NAME"
  printf '      Enforcement:  Active\n'
  printf '      Bypass list:  leave it EMPTY (a bypass actor is the whole rule, undone)\n'
  printf '      Target:       Include by pattern -> refs/heads/%s\n' "$TRUNK"
  printf '      Rules:        Restrict deletions, Block force pushes\n\n'
  printf '  Nothing else needs to be checked. Requiring pull requests or status checks is a\n'
  printf '  separate decision and this script does not make it for you.\n\n'
}

if ! command -v gh >/dev/null 2>&1; then
  printf '\n  gh is not installed, so the ruleset cannot be applied from here.\n'
  printf '  Install it (https://cli.github.com) and re-run, or:\n'
  manual
  exit 0
fi

if ! gh auth status >/dev/null 2>&1; then
  printf '\n  gh is installed but not authenticated (`gh auth login`).\n'
  manual
  exit 0
fi

# The owner/repo slug, from gh when it can answer, otherwise from the origin URL. Both forms of
# remote are handled: git@github.com:owner/repo.git and https://github.com/owner/repo.
SLUG="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
if [ -z "$SLUG" ]; then
  URL="$(git -C "$REPO" remote get-url origin 2>/dev/null || true)"
  # Only a github.com remote can carry a ruleset. A local path or another host must fall through
  # to the manual message rather than being sliced into a slug-shaped string that 404s.
  case "$URL" in
    *github.com*)
      SLUG="$(printf '%s' "$URL" | sed -E 's#^git@github\.com:##; s#^ssh://git@github\.com/##; s#^https?://github\.com/##; s#\.git$##')"
      ;;
    *) SLUG="" ;;
  esac
fi
case "$SLUG" in
  */*/*) SLUG="" ;; # more than one slash is a path, not an owner/repo pair
esac
case "$SLUG" in
  ?*/?*) ;;
  *)
    printf '\n  No GitHub remote found, so there is nothing to protect yet.\n'
    printf '  Add the remote, push the trunk, then re-run this script. Or:\n'
    manual
    exit 0
    ;;
esac

# ── already done? ────────────────────────────────────────────────────────────────────
# The list endpoint does not carry the rules, so each branch ruleset is fetched and matched. The
# match is deliberately coarse (a substring test on the JSON rather than a jq expression over its
# shape): it only has to answer "is this already covered", and being coarse means it keeps
# answering when GitHub adds fields to the payload.
IDS="$(gh api "repos/$SLUG/rulesets" -q '.[] | select(.target == "branch") | .id' 2>/dev/null || true)"
for id in $IDS; do
  detail="$(gh api "repos/$SLUG/rulesets/$id" 2>/dev/null || true)"
  [ -n "$detail" ] || continue
  if printf '%s' "$detail" | grep -q "refs/heads/$TRUNK" &&
     printf '%s' "$detail" | grep -q '"non_fast_forward"' &&
     printf '%s' "$detail" | grep -q '"deletion"'; then
    name="$(printf '%s' "$detail" | sed -n 's/.*"name":"\([^"]*\)".*/\1/p' | head -n 1)"
    printf '\n  Already protected: ruleset %s (id %s) blocks deletion and force-push on %s.\n' \
      "${name:-$id}" "$id" "$TRUNK"
    printf '  Nothing to do.\n\n'
    exit 0
  fi
done

# ── create it ────────────────────────────────────────────────────────────────────────
# `bypass_actors: []` is not an oversight. A ruleset with a bypass actor is a ruleset that stops
# applying to exactly the account most likely to force-push by accident.
if out="$(gh api -X POST "repos/$SLUG/rulesets" --input - 2>&1 <<JSON
{
  "name": "$RULESET_NAME",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["refs/heads/$TRUNK"], "exclude": [] } },
  "rules": [ { "type": "deletion" }, { "type": "non_fast_forward" } ]
}
JSON
)"; then
  printf '\n  Created ruleset "%s" on %s: force-push and deletion are blocked, no bypass actors.\n\n' \
    "$RULESET_NAME" "$SLUG"
  exit 0
fi

case "$out" in
  *"HTTP 403"* | *"HTTP 404"* | *"Must have admin"* | *"Resource not accessible"*)
    printf '\n  GitHub refused: this account does not have admin rights on %s (or the repo is not\n' "$SLUG"
    printf '  visible to it). That is a permission, not a bug, so nothing here failed.\n'
    printf '  Ask whoever has admin to run this script, or:\n'
    manual
    exit 0
    ;;
  *)
    printf '\n  Could not create the ruleset on %s:\n\n%s\n' "$SLUG" "$out"
    manual
    exit 1
    ;;
esac

#!/usr/bin/env node
/**
 * Refuse to deploy from anywhere but a clean trunk that matches the remote.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────
 * A trunk-only deploy rule that lives in a skill file, a runbook or a README is bypassed by
 * anything that invokes npm or the deploy tool directly, which is most things. Two shapes of
 * accident are enough to justify a guard, and both are ordinary:
 *
 *   1. A deploy run from a shared checkout that another session had taken onto a feature branch
 *      with uncommitted changes. It published unfinished work, and removed content that had been
 *      deleted only in that working tree.
 *   2. A broken shell quote fragmenting an `&&` chain, so a command nobody intended ran, and one
 *      of the fragments was the deploy.
 *
 * Both were operator care failing, not configuration failing. So the guard belongs where it
 * cannot be routed around: `predeploy` is an npm lifecycle name, so npm runs it automatically
 * ahead of a `deploy` script when the project has one, and the deploy skill runs it explicitly as
 * its preflight when the deploy command lives in `spec-kit.config.json` instead. Either way the
 * safe path and the easy path are the same path.
 *
 * ── WHAT THIS DELIBERATELY DOES NOT DO ───────────────────────────────────────
 * It reads git state and nothing else. It never touches a secret, and it never reads, writes or
 * echoes a credential. It also does not run for `npm run build` on its own, because building is
 * safe from anywhere; only publishing is not.
 *
 * A worktree checked out at the trunk passes, and must: that is the correct pattern when another
 * session holds the primary checkout.
 *
 * `ALLOW_DIRTY_DEPLOY=1` overrides, loudly, for a genuine hotfix.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/** The repo root, found by walking up for spec-kit.config.json rather than counting `..`. */
function repoRoot() {
  let dir = HERE;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "spec-kit.config.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return join(HERE, "..", "..", "..");
}

const REPO = repoRoot();
const ESCAPE = "ALLOW_DIRTY_DEPLOY";

/**
 * Trimmed stdout of a git command, or null when git itself fails. git's own stderr is swallowed:
 * every caller treats "could not answer" as a fact to report, and a raw "No such remote" printed
 * above this guard's explanation reads as a crash instead of an answer.
 */
function git(...args) {
  try {
    return execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** The trunk branch, from config rather than hardcoded, so a rename cannot strand this. */
function trunk() {
  try {
    const cfg = JSON.parse(readFileSync(join(REPO, "spec-kit.config.json"), "utf8"));
    return cfg?.branching?.trunk || "main";
  } catch {
    return "main";
  }
}

const problems = [];
const TRUNK = trunk();

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== TRUNK) {
  problems.push({
    what: `on branch "${branch ?? "unknown"}", not "${TRUNK}"`,
    fix: `git switch ${TRUNK}   (or deploy from a worktree checked out at ${TRUNK})`,
  });
}

// Untracked files count, and the whole repo is examined rather than just this tool's directory:
// the incident above was caused by changes elsewhere in the tree.
const dirty = git("status", "--porcelain");
if (dirty) {
  const paths = dirty.split("\n").filter(Boolean);
  const shown = paths
    .slice(0, 8)
    .map((p) => `      ${p}`)
    .join("\n");
  problems.push({
    what: `${paths.length} uncommitted change${paths.length === 1 ? "" : "s"} in the working tree`,
    detail: shown + (paths.length > 8 ? `\n      ... and ${paths.length - 8} more` : ""),
    fix: "commit them, stash them, or deploy from a clean worktree",
  });
}

if (git("rev-parse", "-q", "--verify", "MERGE_HEAD")) {
  problems.push({
    what: "an unresolved merge is in progress",
    fix: "finish or abort the merge before deploying",
  });
}

// A local-only commit must not reach the audience before it reaches the remote. Branches have
// diverged from origin for hours while several sessions worked, leaving deployed work absent
// from the remote and unreviewable by anyone else. Skipped entirely when there is no origin:
// a local-only repo cannot be out of sync with a remote it does not have.
const hasOrigin = Boolean(git("remote", "get-url", "origin"));
if (hasOrigin) {
  git("fetch", "origin", TRUNK, "--quiet");
  const head = git("rev-parse", "HEAD");
  const remote = git("rev-parse", `origin/${TRUNK}`);
  if (head && remote && head !== remote) {
    const ahead = git("rev-list", "--count", `origin/${TRUNK}..HEAD`) ?? "?";
    const behind = git("rev-list", "--count", `HEAD..origin/${TRUNK}`) ?? "?";
    problems.push({
      what: `HEAD does not match origin/${TRUNK} (${ahead} ahead, ${behind} behind)`,
      fix: `git push origin ${TRUNK}   (or pull first if behind)`,
    });
  }
}

if (problems.length === 0) {
  console.log(
    `[predeploy] ${TRUNK}, clean${hasOrigin ? `, in sync with origin/${TRUNK}` : " (no origin to compare against)"}. Proceeding.`,
  );
  process.exit(0);
}

const override = process.env[ESCAPE] === "1";
const banner = override ? "OVERRIDDEN" : "REFUSING TO DEPLOY";
const lines = [
  "",
  `  ${banner}: ${problems.length} precondition${problems.length === 1 ? "" : "s"} not met.`,
  "",
];
for (const p of problems) {
  lines.push(`  · ${p.what}`);
  if (p.detail) lines.push(p.detail);
  lines.push(`      fix: ${p.fix}`);
}
lines.push("");

if (override) {
  // Loud on purpose. A silent escape hatch is how a guard gets left permanently disabled; a noisy
  // one is what makes it acceptable to have an escape hatch at all.
  lines.push(`  ${ESCAPE}=1 is set, so this is proceeding anyway.`);
  lines.push(`  Branch "${branch}". This publishes to the deployed surface.`);
  lines.push("");
  console.warn(lines.join("\n"));
  process.exit(0);
}

lines.push(`  Deliberate override, for a genuine hotfix: ${ESCAPE}=1 npm run deploy`);
lines.push("");
console.error(lines.join("\n"));
process.exit(1);

#!/usr/bin/env node
/**
 * Fail if the board claims a ticket is published while the trunk does not carry it.
 *
 * ## The failure this exists for
 *
 * The published statuses (`docs.statusGating.requireOnDeploy`) are not labels. They are a claim
 * that the audience can read the thing on the deployed surface. The failure mode is quiet and it
 * has happened for real: tickets promoted to a published status on the integration branch and
 * left there, with no merge to the trunk and no deploy. Nothing failed, because nothing was
 * looking. **A board that can say something untrue about what the audience has is worse than no
 * board**, because the whole delivery record is then a claim nobody can check.
 *
 * ## What is checked
 *
 * For every ticket in `specsDir` whose status is in `docs.statusGating.requireOnDeploy`: the SAME
 * ticket file must exist on `origin/<trunk>` with the SAME status. Nothing else. It is
 * deliberately a git-only check: no network beyond a fetch, no platform API, no deploy marker to
 * keep in sync. `origin/<trunk>` is what the deploy publishes from, so "is it on `origin/<trunk>`"
 * is the honest proxy for "can the audience see it".
 *
 * The other half of the property belongs to the site build (its own status gating): that the
 * document itself actually reached the bundle. Together the two mean a promotion cannot be
 * half-done:
 *   · this check          the status reached the trunk
 *   · the build's gating  the page reached the bundle
 *
 * ## Where it runs
 *
 * `predeploy`, so a deploy that would leave the board lying is refused; `npm run check:board`
 * from the pre-push hook; and in CI's `verify` job for trunk-bound runs. It passes trivially
 * while a ticket sits mid-lifecycle, which is the whole point: hold work as long as you like,
 * just do not *say* it is published.
 *
 * Exit 0 clean, 1 on a mismatch. `ALLOW_BOARD_DRIFT=1` overrides, loudly, for the case where the
 * deploy itself is what will make the board true.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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
const ESCAPE = "ALLOW_BOARD_DRIFT";

// Every caller here asks git a question and handles "it could not answer" as null, so git's own
// stderr is swallowed rather than printed: "No such remote 'origin'" ahead of this check's own
// explanation reads as a crash instead of an answer.
const git = (...args) => {
  try {
    return execFileSync("git", ["-C", REPO, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

let cfg = {};
try {
  cfg = JSON.parse(readFileSync(join(REPO, "spec-kit.config.json"), "utf8"));
} catch {
  cfg = {};
}

const SPECS = cfg.specsDir || "specs";
const TRUNK = cfg.branching?.trunk || "main";
const PREFIX = /^[A-Za-z0-9]+$/.test(String(cfg.prefix ?? "")) ? cfg.prefix : "[A-Z]+";

// A project with no status gating has no published surface to be wrong about. Silent exit 0:
// the check is scaffolded for every profile so the npm alias and the hook always resolve, and a
// loud "nothing to do" on every push would train people to stop reading the output.
if (!cfg.docs?.statusGating) process.exit(0);

const PUBLISHED = new Set(cfg.docs.statusGating.requireOnDeploy ?? []);
if (PUBLISHED.size === 0) process.exit(0);

/** `status:` from a front-matter block, or "" if there isn't one. */
const statusOf = (text) => /^status:\s*(.+)$/m.exec(text.split("---")[1] ?? "")?.[1].trim() ?? "";

/**
 * The ref this compares against. `origin/<trunk>` by default, which is the honest proxy for "can
 * the audience see it".
 *
 * `BOARD_BASE` exists to break one deadlock, and only one. The integration branch must be pushed
 * BEFORE the trunk: CI's provenance job checks the trunk's content against
 * `origin/<integration>`, so that ref has to be current first. That ordering leaves a window
 * where the integration branch carries a published status and `origin/<trunk>` does not yet,
 * which is precisely what this check refuses, so the two guards would deadlock.
 *
 * The pre-push hook resolves it by re-running with `BOARD_BASE=<trunk>`, the LOCAL branch, and
 * only when local trunk is already ahead of `origin/<trunk>`. That is a narrow and checkable
 * statement: the merge is done, the push is next. It is not a way to defer the work, because the
 * very next command is the trunk push, and CI compares against `origin/<trunk>` regardless.
 */
const BASE = process.env.BOARD_BASE || `origin/${TRUNK}`;

// Only fetch when there is somewhere to fetch from. A local-only repo should report on what it
// has rather than fail on a missing remote.
if (BASE.startsWith("origin/") && git("remote", "get-url", "origin")) {
  git("fetch", "origin", TRUNK, "--quiet");
}

const dir = join(REPO, SPECS);
if (!existsSync(dir)) {
  console.log(`[check-board] no ${SPECS}/ directory yet, nothing to compare.`);
  process.exit(0);
}

const ticketName = new RegExp(`^${PREFIX}-\\d+.*\\.md$`);
const tickets = readdirSync(dir).filter((n) => ticketName.test(n));
const drifted = [];

for (const name of tickets) {
  const status = statusOf(readFileSync(join(dir, name), "utf8"));
  if (!PUBLISHED.has(status)) continue;
  const onTrunk = git("show", `${BASE}:${SPECS}/${name}`);
  if (onTrunk === null) {
    drifted.push(`${name} is ${status} but does not exist on ${BASE} at all`);
    continue;
  }
  const trunkStatus = statusOf(onTrunk);
  if (trunkStatus !== status) {
    drifted.push(`${name} is ${status} here but ${trunkStatus || "(no status)"} on ${BASE}`);
  }
}

if (drifted.length === 0) {
  console.log(`[check-board] every published ticket matches ${BASE}.`);
  process.exit(0);
}

const override = process.env[ESCAPE] === "1";
console.error(
  `\n  ${override ? "OVERRIDDEN" : "REFUSING"}: ${drifted.length} ticket(s) claim to be published, ` +
    `but ${BASE} disagrees.\n\n` +
    drifted.map((d) => `  · ${d}`).join("\n") +
    `\n\n  ${[...PUBLISHED].join("/")} means the work is live on the deployed surface.\n` +
    `  Either ship it:    merge to ${TRUNK} and push it (CI deploys)\n` +
    `  or hold it:        put the ticket back to a mid-lifecycle status until you do\n\n` +
    `  If the deploy you are about to run is what makes this true, ${ESCAPE}=1 skips this once.\n`,
);
process.exit(override ? 0 : 1);

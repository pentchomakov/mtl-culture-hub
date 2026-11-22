#!/usr/bin/env node
/**
 * Nothing reaches the trunk except through the integration branch.
 *
 * The trunk is the release surface and the integration branch is where work is integrated and
 * reviewed. A feature branch merged straight into the trunk skips the local review surface
 * entirely, which is the surface the mid-lifecycle statuses exist to populate, and it skips
 * whatever anyone else has landed on the integration branch in the meantime.
 *
 * ── THE RULE, PRECISELY ──────────────────────────────────────────────────────
 * Every **non-merge** commit newly arriving on the trunk must already be reachable from the
 * integration branch.
 *
 * Non-merge is the operative word and it is not a loophole. The merge commit that
 * `git merge <integration>` creates on the trunk is by construction not reachable from the
 * integration branch: it IS the merge, it carries no content of its own, and forbidding it
 * would forbid the one flow this check exists to permit. What it does forbid is a *content*
 * commit appearing on the trunk that the integration branch has never seen. That covers all
 * three shapes worth stopping:
 *
 *   git merge feat/x       on trunk -> feat/x's commits are not on integration -> refused
 *   git commit             on trunk -> the commit is not on integration        -> refused
 *   git cherry-pick <sha>  on trunk -> a NEW sha, not on integration           -> refused
 *
 * and permits the two that are legitimate:
 *
 *   git merge <integration>            on trunk -> content from integration, plus a merge -> ok
 *   git merge --ff-only <integration>  on trunk -> content from integration               -> ok
 *
 * A cherry-pick being refused is the intended answer, not a rough edge. A hotfix cherry-picked
 * to the trunk and not to the integration branch is exactly how work ends up existing only on
 * the release branch. Cherry-pick to the integration branch and merge down.
 *
 * ── TWO MODES ────────────────────────────────────────────────────────────────
 *   pull request into trunk   the head branch must BE the integration branch. Nothing else is
 *                             examined, because the branch name is the whole question.
 *   push to trunk             walk `before..after` and check every non-merge commit.
 *
 * Locally (no PUSH_BEFORE) it compares `origin/<trunk>..HEAD`, which is what the pre-push hook
 * needs before it decides whether to allow the push.
 *
 * ── WHY THIS EXISTS AT ALL, GIVEN THE HOOK ───────────────────────────────────
 * `tools/githooks/pre-push` refuses the push, which is strictly better, and it only protects a
 * checkout that ran `install.sh`. A fresh clone, a teammate's laptop, a CI job, a web edit and
 * a coding agent in a container all have no hook. This check runs for all of them and gates the
 * *deploy*, so a commit that skipped the integration branch can reach the trunk and still
 * cannot reach the audience.
 *
 * Branch names come from spec-kit.config.json (`branching.trunk`, `branching.integration`), so
 * a rename cannot strand this check. A trunk-only project (integration: null) has no rule to
 * enforce and exits 0.
 *
 *   npm run check:trunk
 *   npm run check:trunk -- --self-test
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The repo root, found by walking up for spec-kit.config.json rather than counting `..`
 * segments, so moving this script does not silently break the config read.
 */
function repoRoot() {
  let dir = HERE;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "spec-kit.config.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return join(HERE, "..", "..", ".."); // tools/docs-site/scripts -> repo root
}

const REPO = repoRoot();

/** Trunk and integration branch names. The literal fallbacks apply only when there is no config. */
function branching() {
  try {
    const cfg = JSON.parse(readFileSync(join(REPO, "spec-kit.config.json"), "utf8"));
    return {
      trunk: cfg?.branching?.trunk || "main",
      integration:
        cfg?.branching?.integration === null ? null : cfg?.branching?.integration || "dev",
    };
  } catch {
    return { trunk: "main", integration: "dev" };
  }
}

const { trunk: TRUNK, integration: INTEGRATION } = branching();

const git = (args, cwd = REPO) =>
  execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim();

const ZERO = "0000000000000000000000000000000000000000";

/** True when `ref` resolves to a commit in `cwd`. */
function resolves(ref, cwd = REPO) {
  try {
    git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * The ref the integration branch lives at, preferring the remote so a stale local branch cannot
 * widen the rule: a local `<integration>` left behind three months ago would bless commits the
 * team's actual integration branch has never seen.
 */
function integrationRef(cwd = REPO) {
  for (const ref of [
    `origin/${INTEGRATION}`,
    `refs/remotes/origin/${INTEGRATION}`,
    INTEGRATION,
  ]) {
    if (resolves(ref, cwd)) return ref;
  }
  return null;
}

/**
 * Content commits arriving in `range` that the integration branch has never seen.
 *
 * `--no-merges` drops the merge commits themselves; `--not <integration>` drops everything
 * already reachable from the integration branch. What survives is new content that bypassed
 * integration.
 */
export function offendingCommits(range, integration, cwd = REPO) {
  const out = git(["rev-list", "--no-merges", range, "--not", integration], cwd);
  return out ? out.split("\n").filter(Boolean) : [];
}

function describe(sha) {
  try {
    return git(["show", "-s", "--format=%h %an: %s", sha]);
  } catch {
    return sha;
  }
}

function fail(lines) {
  console.error(`\n[check:trunk] REFUSED\n`);
  for (const l of lines) console.error(`  ${l}`);
  console.error(
    `\n  ${TRUNK} is the release surface; ${INTEGRATION} is where work is integrated and reviewed.\n` +
      `  Land this on ${INTEGRATION} first, then merge ${INTEGRATION} into ${TRUNK}:\n\n` +
      `      git switch ${INTEGRATION} && git merge <your branch> && git push origin ${INTEGRATION}\n` +
      `      git switch ${TRUNK} && git merge ${INTEGRATION} && git push origin ${TRUNK}\n`,
  );
  process.exit(1);
}

// --------------------------------------------------------------------------- //
// Self-test: the shapes this must accept and refuse, against real git history
// --------------------------------------------------------------------------- //
// Built in a throwaway repo rather than measured against this project's own history, so the
// cases are the actual shapes (a merge, a direct commit, a cherry-pick) instead of ranges that
// happen to stand in for them. A synthetic repo also means the self-test answers the same way
// on a fresh clone, in CI, and in a worktree.
if (process.argv.includes("--self-test")) {
  const T = TRUNK;
  const I = INTEGRATION || "dev";
  const root = mkdtempSync(join(tmpdir(), "check-trunk-selftest-"));
  const g = (...args) => git(args, root);

  const commit = (file, body, msg) => {
    writeFileSync(join(root, file), body);
    g("add", file);
    g("commit", "-m", msg);
    return g("rev-parse", "HEAD");
  };

  let bad = 0;
  try {
    g("init", "--quiet");
    g("config", "user.email", "self-test@example.invalid");
    g("config", "user.name", "spec kit self test");
    g("config", "commit.gpgsign", "false");
    g("checkout", "--quiet", "-b", T);
    const base = commit("a.txt", "a\n", "base commit on the trunk");

    // The integration branch gets one content commit, then the trunk merges it.
    g("checkout", "--quiet", "-b", I);
    const onIntegration = commit("b.txt", "b\n", "content landed on the integration branch");
    g("checkout", "--quiet", T);
    g("merge", "--no-ff", "--no-edit", "--quiet", I);
    const mergeSha = g("rev-parse", "HEAD");

    // A commit made straight on the trunk, and a cherry-pick of an integration-branch commit
    // that never reached the integration branch as that sha.
    g("checkout", "--quiet", "-b", "feat/never-integrated", I);
    const onFeature = commit("c.txt", "c\n", "content that only ever lived on a feature branch");
    g("checkout", "--quiet", T);
    const beforeDirect = g("rev-parse", "HEAD");
    const direct = commit("d.txt", "d\n", "a commit made directly on the trunk");
    g("cherry-pick", onFeature);
    const picked = g("rev-parse", "HEAD");

    const cases = [
      {
        label: "a merge of the integration branch carries nothing the integration branch lacks",
        range: `${base}..${mergeSha}`,
        expect: 0,
      },
      {
        label: "the merge commit itself is in the range, and is exempt",
        range: `${base}..${mergeSha}`,
        expect: 0,
        also: () => {
          const all = g("rev-list", `${base}..${mergeSha}`).split("\n").filter(Boolean);
          return all.includes(mergeSha)
            ? null
            : "the merge commit was not in the range, so exemption was never exercised";
        },
      },
      {
        label: "a commit made directly on the trunk IS reported",
        range: `${beforeDirect}..${direct}`,
        expect: 1,
      },
      {
        label: "a cherry-pick onto the trunk is a new sha and IS reported",
        range: `${direct}..${picked}`,
        expect: 1,
      },
      {
        label: "an integration-branch commit measured against the integration branch is clean",
        range: `${base}..${onIntegration}`,
        expect: 0,
      },
    ];

    console.log("\n[check:trunk] --self-test (synthetic repo, real git history)\n");
    for (const c of cases) {
      const got = offendingCommits(c.range, I, root).length;
      const extra = c.also ? c.also() : null;
      const ok = got === c.expect && !extra;
      if (!ok) bad++;
      console.log(`  ${ok ? "ok    " : "WRONG "} ${c.label}`);
      console.log(`         range=${c.range} not=${I} offenders=${got} want=${c.expect}`);
      if (extra) console.log(`         ${extra}`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  if (bad) {
    console.error(`\nSELF-TEST FAILED: ${bad} case(s) behaved wrongly.\n`);
    process.exit(1);
  }
  console.log(
    "\nSELF-TEST PASSED: the rule accepts an integration merge and reports content integration never saw.\n",
  );
  process.exit(0);
}

// --------------------------------------------------------------------------- //
// Entry
// --------------------------------------------------------------------------- //
if (INTEGRATION === null) {
  // A trunk-only project has no integration branch to come through, so there is no rule here to
  // enforce. Silence would be worse than a note: the next reader needs to know the check ran.
  console.log(
    "[check:trunk] branching.integration is null: trunk-only project, nothing to enforce.",
  );
  process.exit(0);
}

const prHead = process.env.PR_HEAD_REF; // set only for a pull_request event
if (prHead) {
  if (prHead !== INTEGRATION) {
    fail([
      `this pull request targets ${TRUNK} from "${prHead}".`,
      `Only ${INTEGRATION} may merge into ${TRUNK}.`,
    ]);
  }
  console.log(`[check:trunk] ok: pull request into ${TRUNK} comes from ${INTEGRATION}.`);
  process.exit(0);
}

const integration = integrationRef();
if (!integration) {
  // Not a soft pass. Being unable to answer the question is a failure, or the check becomes a
  // no-op on exactly the shallow clone where it matters most.
  fail([
    `no ${INTEGRATION} ref found (looked for origin/${INTEGRATION}, then ${INTEGRATION}).`,
    "In CI this means the checkout was shallow: actions/checkout needs fetch-depth: 0.",
  ]);
}

const before = process.env.PUSH_BEFORE;
// The tip being pushed. `HEAD` is right in CI and for the common local case, but a
// `git push origin <integration> <trunk>` from an integration checkout would otherwise measure
// the wrong branch, so the hook passes the sha git is actually about to send.
const head = process.env.PUSH_HEAD || "HEAD";

/** The commits this push adds, measured from the published trunk when one is knowable. */
function localRange() {
  for (const base of [`origin/${TRUNK}`, TRUNK]) {
    if (resolves(base)) return `${base}..${head}`;
  }
  return `${integration}...${head}`;
}

const range =
  before && before !== ZERO && before !== "" ? `${before}..${head}` : localRange();

let offenders;
try {
  offenders = offendingCommits(range, integration);
} catch (err) {
  fail([`could not walk ${range}: ${err.message.split("\n")[0]}`]);
}

if (offenders.length) {
  fail([
    `${offenders.length} commit(s) on ${TRUNK} that ${INTEGRATION} has never seen:`,
    "",
    ...offenders.slice(0, 20).map((s) => `  ${describe(s)}`),
    ...(offenders.length > 20 ? [`  ... and ${offenders.length - 20} more`] : []),
  ]);
}

console.log(`[check:trunk] ok: every content commit in ${range} is already on ${integration}.`);

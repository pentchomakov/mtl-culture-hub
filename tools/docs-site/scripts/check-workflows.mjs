#!/usr/bin/env node
/**
 * The automation is intact and runnable, checked before it is relied on.
 *
 * The deploy is not a thing a person does; it is a thing `.github/workflows/ci.yml` does when
 * something lands on the trunk. That makes the workflow file a load-bearing part of the delivery
 * path, and a load-bearing file with no check on it is the shape of most delivery incidents: a
 * guard that existed, was correct, and silently stopped applying.
 *
 * A YAML file that no longer parses does not fail loudly. GitHub reports it as a workflow that
 * simply did not run, which on a green-looking commit list reads as "nothing needed to happen".
 * The same is true of a job whose `if:` has drifted, or a `needs:` that lost an entry: the run
 * goes green having skipped the thing that mattered.
 *
 * ── WHY IT RUNS FIRST, IN THREE PLACES ───────────────────────────────────────
 * Inside `npm run build`, so every local build and every CI job hits it; as the first job in the
 * workflow (`workflows-intact`), which every later job `needs:`; and in the pre-push hook, so a
 * trunk push is refused while the automation that would publish it is broken. The ordering is
 * the point: the pre-check happens *before* the merge, not after.
 *
 * ── WHAT IS ASSERTED, AND WHY EACH ONE ───────────────────────────────────────
 * Structure, not spelling. Every assertion below is a property that, if lost, produces a green
 * run that published nothing, or published something it should not have:
 *
 *   parses              a workflow that does not parse does not run, silently
 *   triggers            lose the trunk push and the deploy stops happening at all
 *   job graph           lose a `needs:` and the deploy races its own verification
 *   deploy is trunk     an `if:` drift is how the integration branch gets published
 *   provenance          the gate job actually runs the check, not a placeholder
 *   serialized          `cancel-in-progress: true` half-publishes an asset manifest
 *   fetch-depth 0       the git-history checks silently pass on a shallow clone
 *   no regeneration     a runner lacks the authoring toolchain; regenerating destroys output
 *   no secret writes    a secret operation in CI is how a whole secret list goes at once
 *   no secret echo      a token in a run log is a leaked token
 *   least privilege     `permissions:` must not hand a workflow write access it never needs
 *   wired into build    the check itself must stay inside `npm run build`
 *
 * Branch names come from spec-kit.config.json, so a rename does not turn an assertion into a
 * false failure. A project that scaffolded no workflow at all is allowed: absence exits 0 with a
 * warning, because there is nothing to be wrong. A workflow that exists and is broken is not.
 *
 *   npm run check:workflows
 *   npm run check:workflows -- --self-test
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

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
const WF_DIR = join(REPO, ".github/workflows");
const PKG = join(REPO, "tools/docs-site/package.json");
const CI = "ci.yml";
const SELF = "check-workflows.mjs";

/** Config, with the literal fallbacks that apply only when there is no config file. */
function config() {
  try {
    return JSON.parse(readFileSync(join(REPO, "spec-kit.config.json"), "utf8"));
  } catch {
    return {};
  }
}

/** Every `run:` script in a job, flattened. */
const runsOf = (job) => (job?.steps ?? []).map((s) => s?.run).filter((r) => typeof r === "string");

/** Every step across every job, with its job name, so a message can point at one. */
function allSteps(doc) {
  return Object.entries(doc?.jobs ?? {}).flatMap(([name, job]) =>
    (job?.steps ?? []).map((step) => ({ job: name, step })),
  );
}

const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

function runAll(sources) {
  const results = [];
  const check = (id, label, problem, warn) =>
    results.push({ id, label, problem: problem || null, warn: warn || null });

  const cfg = sources.cfg ?? {};
  const TRUNK = cfg.branching?.trunk || "main";
  const INTEGRATION =
    cfg.branching?.integration === null ? null : cfg.branching?.integration || "dev";
  const BUILD_CMD = typeof cfg.docs?.buildCommand === "string" ? cfg.docs.buildCommand.trim() : "";

  // ---- 1. every workflow file parses -------------------------------------
  const parsed = {};
  const unparseable = [];
  for (const [name, text] of Object.entries(sources.workflows)) {
    try {
      parsed[name] = yaml.load(text);
    } catch (err) {
      unparseable.push(`${name}: ${String(err.message).split("\n")[0]}`);
    }
  }
  check(
    "workflows-parse",
    "every workflow file is valid YAML",
    unparseable.length
      ? `GitHub skips a workflow it cannot parse, silently:\n    ` + unparseable.join("\n    ")
      : null,
  );

  // ---- 2. the pipeline exists, or does not, deliberately ------------------
  // Absence is allowed: a project with no GitHub remote or no deploy command scaffolds no
  // workflow, and asserting against a file that was never meant to exist would make the check
  // unusable there. A file that exists and does not parse is a different thing entirely.
  if (!(CI in sources.workflows)) {
    check(
      "ci-workflow-exists",
      `no ${CI}: this project scaffolded no pipeline`,
      null,
      `no .github/workflows/${CI}. Nothing is asserted about a pipeline this project does not have.`,
    );
    return results;
  }
  const doc = parsed[CI];
  if (!doc || typeof doc !== "object") {
    check(
      "ci-workflow-exists",
      `${CI} exists and parses`,
      `${CI} is present but unparseable. Without it nothing deploys, and nothing says so.`,
    );
    return results; // every remaining assertion is about this file
  }
  check("ci-workflow-exists", `${CI} exists and parses`, null);

  const on = doc.on ?? doc.true; // YAML 1.1 parses a bare `on:` key as boolean true
  const jobs = doc.jobs ?? {};

  // ---- 3. triggers --------------------------------------------------------
  const pushBranches = asList(on?.push?.branches);
  const prBranches = asList(on?.pull_request?.branches);
  const missingTriggers = [
    !pushBranches.includes(TRUNK) && `push to ${TRUNK} (nothing would deploy)`,
    INTEGRATION &&
      !pushBranches.includes(INTEGRATION) &&
      `push to ${INTEGRATION} (integration would go unverified)`,
    !prBranches.includes(TRUNK) && `pull_request into ${TRUNK} (a PR would go unchecked)`,
  ].filter(Boolean);
  check(
    "triggers",
    `triggers cover push:${TRUNK}${INTEGRATION ? `, push:${INTEGRATION}` : ""} and pull_request:${TRUNK}`,
    missingTriggers.length ? "missing: " + missingTriggers.join("; ") : null,
  );

  // ---- 4. the job graph --------------------------------------------------
  const required = ["workflows-intact", "source-is-integration", "verify", "deploy"];
  const absent = required.filter((j) => !jobs[j]);
  check(
    "jobs-present",
    "all four jobs are present",
    absent.length ? `missing job(s): ${absent.join(", ")}` : null,
  );

  const deploy = jobs.deploy;
  if (deploy) {
    const needs = asList(deploy.needs);
    const missingNeeds = ["workflows-intact", "source-is-integration", "verify"].filter(
      (n) => !needs.includes(n),
    );
    check(
      "deploy-needs-its-gates",
      "deploy waits on workflows-intact, source-is-integration and verify",
      missingNeeds.length
        ? `deploy does not need: ${missingNeeds.join(", ")}. It would publish alongside its own ` +
            `verification rather than after it.`
        : null,
    );

    const cond = String(deploy.if ?? "");
    const trunkOnly = cond.includes(`refs/heads/${TRUNK}`) && cond.includes("push");
    check(
      "deploy-is-trunk-push-only",
      `deploy runs only on a push to ${TRUNK}`,
      trunkOnly
        ? null
        : `deploy's \`if:\` is ${cond || "(absent)"}. It must name both a push event and ` +
            `refs/heads/${TRUNK}, or pull requests and other branches get published.`,
    );
  }

  // ---- 5. the provenance job actually runs the check ----------------------
  const gate = jobs["source-is-integration"];
  const gateRuns = runsOf(gate).join("\n");
  check(
    "gate-runs-the-check",
    "source-is-integration runs check-trunk-from-integration.mjs",
    gateRuns.includes("check-trunk-from-integration")
      ? null
      : "the source-is-integration job does not invoke check-trunk-from-integration.mjs, so it " +
          "asserts nothing while still reporting green.",
  );

  // ---- 6. serialized, never cancelled ------------------------------------
  const conc = doc.concurrency;
  check(
    "deploys-serialize",
    "concurrency is set and never cancels in progress",
    conc && conc.group && conc["cancel-in-progress"] === false
      ? null
      : `concurrency must set a group with cancel-in-progress: false. Cancelling a partial ` +
          `deploy leaves a half-published asset manifest.`,
  );

  // ---- 7. history-dependent jobs get full history ------------------------
  const shallow = [];
  for (const name of ["source-is-integration", "verify", "deploy"]) {
    const co = (jobs[name]?.steps ?? []).find((s) =>
      String(s?.uses ?? "").startsWith("actions/checkout"),
    );
    if (!co) shallow.push(`${name}: no checkout step`);
    else if (co.with?.["fetch-depth"] !== 0) shallow.push(`${name}: fetch-depth is not 0`);
  }
  check(
    "full-history-where-needed",
    "the git-history jobs check out full history",
    shallow.length
      ? `a shallow clone makes these checks silently pass:\n    ` + shallow.join("\n    ")
      : null,
  );

  // ---- 8. CI never regenerates committed generated content ----------------
  // Only assertable when the project has a generator to run. The runner does not have the
  // authoring toolchain (Office, LibreOffice, a design tool, whatever the source format needs),
  // so a regeneration falls back to whatever it can parse and prunes the rest, then commits or
  // publishes the loss. Generated output is committed; CI builds from it.
  const rebuildSteps = BUILD_CMD
    ? allSteps(doc)
        .filter(({ step }) => String(step?.run ?? "").includes(BUILD_CMD))
        .map(({ job }) => job)
    : [];
  check(
    "no-generated-rebuild",
    BUILD_CMD
      ? `no step runs the project's generator (${BUILD_CMD})`
      : "no generator configured, so nothing to forbid",
    rebuildSteps.length
      ? `job(s) ${[...new Set(rebuildSteps)].join(", ")} run \`${BUILD_CMD}\`. A runner has none ` +
          `of the authoring tools the generator needs, so a full regeneration degrades the ` +
          `committed output instead of refreshing it.`
      : null,
  );

  // ---- 9. CI never writes a secret ---------------------------------------
  const secretWrites = allSteps(doc)
    .filter(({ step }) => /\bsecret\s+(put|delete)\b|wrangler\s+secret/.test(String(step?.run ?? "")))
    .map(({ job }) => job);
  check(
    "no-secret-mutation",
    "no step mutates a deployment secret",
    secretWrites.length
      ? `job(s) ${[...new Set(secretWrites)].join(", ")} mutate secrets. A normal deploy ` +
          `preserves them; a secret operation in CI is how a whole secret list goes at once.`
      : null,
  );

  // ---- 10. a secret is never printed -------------------------------------
  const echoed = allSteps(doc)
    .filter(({ step }) => {
      const run = String(step?.run ?? "");
      return /secrets\./.test(run) || /\$\{\{\s*secrets\./.test(String(step?.name ?? ""));
    })
    .map(({ job }) => job);
  check(
    "no-secret-in-run-body",
    "secrets reach steps through env:, never interpolated into a script",
    echoed.length
      ? `job(s) ${[...new Set(echoed)].join(", ")} interpolate a secret into a run body or a ` +
          `step name. Pass it via env: so it cannot be echoed into a log.`
      : null,
  );

  // ---- 11. least privilege ----------------------------------------------
  const perms = doc.permissions;
  const writeScopes =
    perms && typeof perms === "object"
      ? Object.entries(perms)
          .filter(([, v]) => v === "write")
          .map(([k]) => k)
      : perms === "write-all"
        ? ["write-all"]
        : [];
  check(
    "least-privilege",
    "the workflow grants no write scopes",
    writeScopes.length
      ? `permissions grants write on: ${writeScopes.join(", ")}. This workflow reads the repo ` +
          `and deploys; it never writes to GitHub.`
      : null,
  );

  // ---- 12. this check stays inside the build -----------------------------
  // The assertions above are worth nothing if the only thing that runs them is a job in the
  // file they assert against. Keeping it in `npm run build` means a local build and every CI
  // job hit it by construction, so removing the gate breaks the build rather than going quiet.
  // Either spelling counts: the direct `node scripts/check-workflows.mjs` or the `check:workflows`
  // alias. A later rewrite of package.json is free to pick one without tripping this.
  const inBuild = /"build"\s*:\s*"[^"]*(check-workflows\.mjs|check:workflows)/.test(sources.pkg);
  check(
    "check-runs-inside-build",
    `npm run build still runs ${SELF}`,
    !sources.pkg || inBuild
      ? null
      : `the build script no longer runs ${SELF}. Every assertion here then depends on the one ` +
          `job inside the file it is checking.`,
  );

  return results;
}

// --------------------------------------------------------------------------- //
// Sources
// --------------------------------------------------------------------------- //
function read() {
  const workflows = {};
  if (existsSync(WF_DIR)) {
    for (const f of readdirSync(WF_DIR)) {
      if (/\.ya?ml$/.test(f)) workflows[f] = readFileSync(join(WF_DIR, f), "utf8");
    }
  }
  return {
    workflows,
    pkg: existsSync(PKG) ? readFileSync(PKG, "utf8") : "",
    cfg: config(),
  };
}

const sources = read();

// --------------------------------------------------------------------------- //
// Self-test
// --------------------------------------------------------------------------- //
// Every mutation below is a regression that has plausibly happened to a pipeline, applied to an
// in-memory copy of this project's own workflow. Object-level mutation (parse, edit, re-dump)
// rather than string replacement, deliberately: a text `.replace()` that stops matching after a
// formatting change becomes a no-op, and a no-op mutation reports as a caught regression when
// nothing was tested at all.
if (process.argv.includes("--self-test")) {
  if (!(CI in sources.workflows)) {
    console.error(
      `\n[check:workflows] --self-test needs .github/workflows/${CI} to mutate, and this repo has none.\n`,
    );
    process.exit(1);
  }

  const asText = (fn) => (s) => ({
    ...s,
    workflows: { ...s.workflows, [CI]: fn(s.workflows[CI]) },
  });
  /** Parse, mutate the object, dump back: format-independent, so it cannot silently no-op. */
  const asDoc = (fn) =>
    asText((t) => {
      const d = yaml.load(t);
      fn(d);
      return yaml.dump(d, { lineWidth: 200 });
    });
  const stepsOf = (d, job) => (d.jobs[job].steps ??= []);
  const BUILD_CMD =
    typeof sources.cfg.docs?.buildCommand === "string" ? sources.cfg.docs.buildCommand.trim() : "";
  const TRUNK = sources.cfg.branching?.trunk || "main";

  const MUTATIONS = [
    {
      label: "the workflow file stops parsing",
      mutate: asText((t) => t + "\n  this: is: not: valid: yaml\n"),
      expect: ["workflows-parse"],
    },
    {
      label: `push:${TRUNK} is dropped, so nothing would ever deploy`,
      mutate: asDoc((d) => {
        const on = d.on ?? d.true;
        on.push.branches = on.push.branches.filter((b) => b !== TRUNK);
      }),
      expect: ["triggers"],
    },
    {
      label: "the verify job disappears",
      mutate: asDoc((d) => {
        delete d.jobs.verify;
      }),
      expect: ["jobs-present"],
    },
    {
      label: "deploy stops needing source-is-integration",
      mutate: asDoc((d) => {
        d.jobs.deploy.needs = ["workflows-intact", "verify"];
      }),
      expect: ["deploy-needs-its-gates"],
    },
    {
      label: "deploy's branch condition drifts to any push",
      mutate: asDoc((d) => {
        d.jobs.deploy.if = "github.event_name == 'push'";
      }),
      expect: ["deploy-is-trunk-push-only"],
    },
    {
      label: "the provenance job becomes a placeholder",
      mutate: asDoc((d) => {
        for (const s of stepsOf(d, "source-is-integration")) if (s.run) s.run = "echo ok";
      }),
      expect: ["gate-runs-the-check"],
    },
    {
      label: "deploys start cancelling each other",
      mutate: asDoc((d) => {
        d.concurrency["cancel-in-progress"] = true;
      }),
      expect: ["deploys-serialize"],
    },
    {
      label: "a history-dependent job loses fetch-depth: 0",
      mutate: asDoc((d) => {
        for (const s of stepsOf(d, "verify")) {
          if (String(s.uses ?? "").startsWith("actions/checkout")) delete s.with;
        }
      }),
      expect: ["full-history-where-needed"],
    },
    {
      label: BUILD_CMD
        ? "someone adds a helpful keep-the-generated-content-fresh step"
        : "generator step (skipped: docs.buildCommand is not set)",
      skip: !BUILD_CMD,
      mutate: asDoc((d) => {
        stepsOf(d, "verify").unshift({ name: "refresh generated content", run: BUILD_CMD });
      }),
      expect: ["no-generated-rebuild"],
    },
    {
      label: "a secret write appears in CI",
      mutate: asDoc((d) => {
        stepsOf(d, "deploy").unshift({ name: "set a secret", run: "wrangler secret put API_KEY" });
      }),
      expect: ["no-secret-mutation"],
    },
    {
      label: "a token is interpolated into a run body",
      mutate: asDoc((d) => {
        stepsOf(d, "deploy").unshift({
          name: "debug",
          run: "echo ${{ secrets.DEPLOY_TOKEN }} > /dev/null",
        });
      }),
      expect: ["no-secret-in-run-body"],
    },
    {
      label: "the workflow is handed write access",
      mutate: asDoc((d) => {
        d.permissions = { contents: "write" };
      }),
      expect: ["least-privilege"],
    },
    {
      label: "the build script stops running this check",
      // Either spelling, because the assertion accepts either. A mutation that no longer matches
      // would be a no-op, and the self-test reports that as a MISS rather than pretending.
      mutate: (s) => ({
        ...s,
        pkg: s.pkg.replace(/(node scripts\/check-workflows\.mjs|npm run check:workflows) && /, ""),
      }),
      expect: ["check-runs-inside-build"],
    },
  ];

  console.log("\n[check:workflows] --self-test: each regression below must be caught\n");
  let bad = 0;
  for (const m of MUTATIONS) {
    if (m.skip) {
      console.log(`  skip    ${m.label}`);
      continue;
    }
    const caught = runAll(m.mutate(sources))
      .filter((r) => r.problem)
      .map((r) => r.id);
    const missed = m.expect.filter((id) => !caught.includes(id));
    const ok = caught.length > 0 && missed.length === 0;
    if (!ok) bad++;
    console.log(`  ${ok ? "caught" : "MISSED"}  ${m.label}`);
    console.log(`          by: ${caught.length ? caught.join(", ") : "(nothing)"}`);
    if (missed.length) console.log(`          expected but silent: ${missed.join(", ")}`);
  }
  if (bad) {
    console.error(`\nSELF-TEST FAILED: ${bad} regression(s) went undetected.\n`);
    process.exit(1);
  }
  console.log("\nSELF-TEST PASSED: every reconstructed regression was caught.\n");
  process.exit(0);
}

// --------------------------------------------------------------------------- //
// Entry
// --------------------------------------------------------------------------- //
const results = runAll(sources);
const n = Object.keys(sources.workflows).length;
console.log(`\n[check:workflows] the automation is intact, ${n} workflow file(s)`);
for (const r of results) console.log(`  ${r.problem ? "FAIL" : r.warn ? "warn" : "ok  "}  ${r.label}`);

const failed = results.filter((r) => r.problem);
if (failed.length) {
  console.error("");
  for (const r of failed) console.error(`${r.id}:\n  ${r.problem}\n`);
  console.error(
    "The deploy is what the workflow does when something lands on the trunk. A broken workflow\n" +
      "does not fail loudly: GitHub reports it as a run that did not happen. Run\n" +
      "`npm run check:workflows -- --self-test` to see the shapes this guards against.\n",
  );
  process.exit(1);
}

for (const r of results.filter((r) => r.warn)) console.log(`\n  note: ${r.warn}`);
if (results.some((r) => r.id === "ci-workflow-exists" && !r.warn)) {
  console.log("\nthe deploy path is wired, gated and least-privileged.");
}

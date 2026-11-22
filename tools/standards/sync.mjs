#!/usr/bin/env node
// standards sync — mirror Compass standards from compassanalytics/compass-standards into this project.
//
// Copied by spec-init to tools/standards/sync.mjs and driven by the `standards` block of
// spec-kit.config.json:
//
//   "standards": {
//     "repo": "compassanalytics/compass-standards",
//     "ref":  "<40-char sha>",                         pinned at init; /standards-sync re-pins
//     "docs": [{ "path": "standards/.../x.md", "to": "docs/reference/x.md" }]
//   }
//
// Why a pinned sha and a local copy, rather than a link: a future-state architecture, a wireframe
// requirements document or a roadmap is specified against these standards, so the project has to be
// able to say which version it was held to, and a reviewer has to be able to read it offline. The
// mirror carries provenance front matter (source, repo, path, ref, retrieved, title) so drift is
// visible, and `--check` reports it without writing.
//
// Usage:
//   node tools/standards/sync.mjs            mirror every doc at the pinned ref
//   node tools/standards/sync.mjs --check    report drift between the pin and the repo head, and
//                                            between the pin and each local mirror; writes nothing
//   [--config <path>] [--root <dir>]         defaults: ./spec-kit.config.json, the config's directory
//
// Writes go through a temp file per doc and land only when every fetch succeeded, so a missing
// path or a refused request leaves nothing partial. Exit 1 with the reason on no `gh` login, a
// missing path at the pinned ref, or any non-200; exit 2 on a bad config.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const CHECK = args.includes("--check");
const configPath = resolve(flag("config", "spec-kit.config.json"));
const ROOT = resolve(flag("root", dirname(configPath)));

let cfg;
try {
  cfg = JSON.parse(readFileSync(configPath, "utf8"));
} catch (e) {
  console.error(`standards-sync: cannot read ${configPath}: ${e.message}`);
  process.exit(2);
}
const S = cfg.standards;
if (!S || !S.repo || !Array.isArray(S.docs) || S.docs.length === 0) {
  console.error("standards-sync: spec-kit.config.json needs a `standards` block with repo and a non-empty docs list.");
  process.exit(2);
}
if (!S.ref && !CHECK) {
  // Init could not reach the repo, so it left the pin empty. The check still works and prints the head.
  console.error("standards-sync: standards.ref is not set. Run `--check` to see the repo head, set standards.ref to it, then sync.");
  process.exit(2);
}
for (const d of S.docs) {
  if (!d.path || !d.to) {
    console.error(`standards-sync: every docs entry needs path and to; got ${JSON.stringify(d)}`);
    process.exit(2);
  }
}

function gh(apiArgs) {
  return execFileSync("gh", apiArgs, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
}
function haveGh() {
  try { gh(["auth", "status"]); return true; } catch { return false; }
}
if (!haveGh()) {
  console.error(`standards-sync: ${S.repo} is private; run \`gh auth login\` with an account that can read it and try again.`);
  process.exit(1);
}

// One REST read per doc. `contents` omits `content` past 1MB; the blob API never does.
function fetchDoc(path, ref) {
  let meta;
  try {
    meta = JSON.parse(gh(["api", `repos/${S.repo}/contents/${path}?ref=${ref}`]));
  } catch (e) {
    const msg = String(e.stderr || e.message || "");
    if (!/404|Not Found/.test(msg)) {
      console.error(`standards-sync: fetching ${path} failed before the path could be checked (${msg.trim().split("\n")[0]}). Nothing was written.`);
      process.exit(1);
    }
    return null;
  }
  if (meta.type !== "file") return null;
  let body = meta.content ? Buffer.from(meta.content, "base64").toString("utf8") : null;
  if (body === null) {
    const blob = JSON.parse(gh(["api", `repos/${S.repo}/git/blobs/${meta.sha}`]));
    body = Buffer.from(blob.content, blob.encoding || "base64").toString("utf8");
  }
  return { body, sha: meta.sha };
}

function frontMatterOf(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split("\n")) {
    const k = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (k) out[k[1]] = k[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function headSha() {
  try {
    const branch = gh(["api", `repos/${S.repo}`, "-q", ".default_branch"]).trim();
    return { branch, sha: gh(["api", `repos/${S.repo}/commits/${branch}`, "-q", ".sha"]).trim() };
  } catch {
    console.error(`standards-sync: cannot read ${S.repo}: not found, or the active gh account cannot see it. Check \`gh auth status\`.`);
    process.exit(1);
  }
}

if (CHECK) {
  const head = headSha();
  const pinned = S.ref === head.sha;
  console.log(`pin ${S.ref ? S.ref.slice(0, 7) : "none"}  head ${head.sha.slice(0, 7)} (${head.branch})  ${S.ref ? (pinned ? "up to date" : "repo has moved since the pin") : "not pinned yet: set standards.ref to the head"}`);
  let drift = !pinned;
  for (const d of S.docs) {
    const local = join(ROOT, d.to);
    if (!existsSync(local)) { console.log(`missing ${d.to}`); drift = true; continue; }
    const fm = frontMatterOf(readFileSync(local, "utf8"));
    const same = !!S.ref && fm.ref === S.ref && fm.path === d.path;
    console.log(`${same ? "ok     " : "stale  "} ${d.to}  (mirror ref ${(fm.ref || "?").slice(0, 7)}, retrieved ${fm.retrieved || "?"})`);
    if (!same) drift = true;
  }
  console.log(`drift: ${drift ? "yes" : "no"}`);
  process.exit(0);
}

const today = new Date().toISOString().slice(0, 10);
const staged = [];
for (const d of S.docs) {
  const got = fetchDoc(d.path, S.ref);
  if (!got) {
    for (const t of staged) rmSync(t.tmp, { force: true });
    console.error(`standards-sync: ${d.path} is not a file in ${S.repo} at ${S.ref}; nothing was written.`);
    process.exit(1);
  }
  // Strip any front matter the standard carries; ours replaces it.
  const body = got.body.replace(/^---\n[\s\S]*?\n---\n+/, "");
  const h1 = body.match(/^#\s+(.+?)\s*$/m);
  const title = (h1 ? h1[1] : basename(d.path, ".md")).replace(/"/g, "'");
  const fm = [
    "---",
    `title: "${title}"`,
    `source: https://github.com/${S.repo}/blob/${S.ref}/${d.path}`,
    `repo: ${S.repo}`,
    `path: ${d.path}`,
    `ref: ${S.ref}`,
    `retrieved: '${today}'`,
    "docType: reference",
    "group: Reference",
    "---",
    "",
    `> **Mirrored from \`${S.repo}\` at \`${S.ref.slice(0, 7)}\`, retrieved ${today}.** The standard is the source of truth; edit it there and run \`/standards-sync\`. Reference, not evidence: cite it for how Compass builds things, never as a fact about the client.`,
    "",
  ].join("\n");
  const dest = join(ROOT, d.to);
  mkdirSync(dirname(dest), { recursive: true });
  const tmp = `${dest}.sync-tmp`;
  writeFileSync(tmp, fm + body);
  staged.push({ tmp, dest, d, sha: got.sha });
}
for (const t of staged) {
  renameSync(t.tmp, t.dest);
  console.log(`mirrored ${t.d.to}  (${t.d.path} @ ${S.ref.slice(0, 7)})`);
}
console.log(`standards-sync: ${staged.length} mirrored at ${S.ref.slice(0, 7)}`);

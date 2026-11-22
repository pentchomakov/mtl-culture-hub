import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import matter from "gray-matter";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, "../..");

// ── spec-kit config (repo root) ───────────────────────────────────────────────
interface GroupRule {
  match: string;
  label: string;
}
interface SpecKitConfig {
  name: string;
  specsDir: string;
  /** Ticket id prefix (`TST` in `TST-001-…`). Drives the ticket-filename match in `statusGate()`. */
  prefix?: string;
  branding?: {
    /** A registered CDL theme id (`src/themes/index.ts`). `null` = base CDL greyscale. */
    theme?: string | null;
    /** Legacy alias from before the theme seam; kept so old configs still parse. */
    accent?: string;
  };
  docs?: {
    recurseDirs?: string[];
    rootFiles?: string[];
    groups?: GroupRule[];
    home?: string;
    /** Path prefixes withheld from a deploy build (see `PORTAL_TARGET` below). */
    deployExclude?: string[];
    /** Ticket lifecycle → which portal a deliverable may appear on. See `statusGate()`. */
    statusGating?: {
      /** Statuses whose deliverable is withheld from the deploy build. */
      withholdFromDeploy?: string[];
      /** Statuses whose deliverable MUST be in the deploy build, or the build fails. */
      requireOnDeploy?: string[];
    };
    titleOverrides?: Record<string, string>;
  };
}

const DEFAULT_CONFIG: SpecKitConfig = {
  name: "Project",
  specsDir: "specs",
  branding: { theme: null },
  docs: {
    recurseDirs: ["docs"],
    rootFiles: ["README.md"],
    groups: [],
    deployExclude: [],
    titleOverrides: {},
  },
};

/** Load + normalize spec-kit.config.json from the repo root; fall back to defaults. */
function loadConfig(): SpecKitConfig {
  let parsed: Partial<SpecKitConfig> = {};
  try {
    parsed = JSON.parse(readFileSync(resolve(REPO, "spec-kit.config.json"), "utf8"));
  } catch {
    /* missing/invalid config: use defaults */
  }
  const docs = parsed.docs ?? {};
  return {
    name: parsed.name || DEFAULT_CONFIG.name,
    specsDir: parsed.specsDir || DEFAULT_CONFIG.specsDir,
    prefix: parsed.prefix,
    branding: {
      // `theme` may legitimately be null, so `??` rather than `||`: an explicit null is
      // the "no brand overlay, base CDL greyscale" answer, not a missing value.
      theme: parsed.branding?.theme ?? DEFAULT_CONFIG.branding!.theme,
      accent: parsed.branding?.accent,
    },
    docs: {
      // Spread first so a key added to the config but not defaulted below still arrives.
      // Rebuilding `docs` key-by-key is how `statusGating` gets silently dropped: the
      // config parses, the build succeeds, and the gate simply never fires. A control
      // that fails OPEN must not depend on someone remembering to add a line here.
      ...docs,
      recurseDirs: docs.recurseDirs ?? DEFAULT_CONFIG.docs!.recurseDirs,
      rootFiles: docs.rootFiles ?? DEFAULT_CONFIG.docs!.rootFiles,
      groups: docs.groups ?? DEFAULT_CONFIG.docs!.groups,
      home: docs.home,
      deployExclude: docs.deployExclude ?? DEFAULT_CONFIG.docs!.deployExclude,
      titleOverrides: docs.titleOverrides ?? DEFAULT_CONFIG.docs!.titleOverrides,
    },
  };
}

const cfg = loadConfig();
const SPECS_DIR = cfg.specsDir || "specs";

/** Escape a string for safe interpolation into a RegExp source. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Ticket filenames, from the configured `prefix` rather than a guess at its shape.
 *
 * A ticket this pattern misses is a ticket whose status gates nothing, and that is the one
 * failure of the gate below that looks exactly like success: the build is green and the page
 * ships ungated. A generic `[A-Z]+-\d+` shape misses any prefix carrying a digit (`T2ST-001`),
 * so the prefix is used directly, regex-escaped. Absent from the config, the generic shape is
 * still the best available guess.
 */
const TICKET_FILE_RE = new RegExp(`^${cfg.prefix ? escapeRegex(cfg.prefix) : "[A-Z]+"}-\\d+.*\\.md$`);

// Recurse these dirs for *.md; always include the specs dir so tickets show up.
const RECURSE_DIRS = [...new Set([...(cfg.docs?.recurseDirs || ["docs"]), SPECS_DIR])];
const IGNORE = new Set(["node_modules", "dist", ".git", ".github", "tools", "build"]);
// Individual root-level docs to include.
const ROOT_FILES = cfg.docs?.rootFiles || ["README.md"];
const GROUPS: GroupRule[] = cfg.docs?.groups || [];
const TITLE_OVERRIDES: Record<string, string> = cfg.docs?.titleOverrides || {};

// ── deploy-time content split ────────────────────────────────────────────────
// One corpus, one build, two audiences: the local portal is where the team reviews, the
// deployed portal is where the audience reads. A deploy build (`PORTAL_TARGET=cloud`, set
// by `npm run build:cloud`) drops every doc matched by `docs.deployExclude` from the
// corpus, so excluded material is ABSENT FROM THE BUNDLE rather than merely hidden in the
// UI: a URL guesser must come up empty. Local dev sets nothing and keeps everything.
const CLOUD_BUILD = process.env.PORTAL_TARGET === "cloud";
const DEPLOY_EXCLUDE: string[] = cfg.docs?.deployExclude || [];

/**
 * Compile one `deployExclude` entry into a matcher over repo-relative posix paths.
 *
 * A plain entry matches that exact path OR anything beneath it as a directory
 * (`docs/internal` ⇒ `docs/internal/**`). An entry containing a glob char is a glob
 * (`*` stops at `/`, `**` crosses it, `?` is one non-slash char), with the same
 * exact-or-descendant rule applied to whatever it matched. Deliberately dependency-free:
 * a regex is all this needs.
 */
function excludeMatcher(pattern: string): RegExp {
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        re += ".*";
        i += 1;
      } else {
        re += "[^/]*";
      }
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}(?:/.*)?$`);
}

const EXCLUDE_MATCHERS: RegExp[] = DEPLOY_EXCLUDE.map(excludeMatcher);

/** Index of the first `deployExclude` rule claiming `p`, or -1 (always -1 locally). */
function excludedBy(p: string): number {
  if (!CLOUD_BUILD) return -1;
  return EXCLUDE_MATCHERS.findIndex((re) => re.test(p));
}

// ── ticket-status gating ─────────────────────────────────────────────────────
// `deployExclude` answers "which paths are internal". This answers a different question:
// "how far along is the work". A document being actively redrafted is not audience-facing
// just because its path is not on a list, and a deliverable the audience has been pointed
// at must not be missing from the site they were pointed at.
//
// ── PATHS COME ONLY FROM THE TICKET'S OWN `paths:` KEY ───────────────────────
// Deliberately. The obvious alternative is to derive the doc path from other front-matter
// (an area, a component, a deliverable type) and it does not survive contact with a repo:
// a derivation encodes a directory layout, and whoever next moves a directory has no way
// to know they were also editing a confidentiality gate. Where that was tried it broke
// twice: loudly in one direction (required paths that no longer existed failed the
// build) and silently in the other (withheld paths that resolved to nothing shipped
// ungated, which is the failure nobody notices).
//
// So a ticket says what it gates, or it gates nothing:
//   paths: ["docs/x.md"]  gates exactly those paths
//   paths: []             gates nothing, deliberately (honoured in silence)
//   (key absent)          cannot be resolved: one WARN line naming the ticket
const WITHHOLD_STATUSES = new Set(cfg.docs?.statusGating?.withholdFromDeploy ?? []);
const REQUIRE_STATUSES = new Set(cfg.docs?.statusGating?.requireOnDeploy ?? []);
const STATUS_GATING = !!cfg.docs?.statusGating && (WITHHOLD_STATUSES.size > 0 || REQUIRE_STATUSES.size > 0);

interface StatusGate {
  /** Doc path → the ticket that withholds it, e.g. "TST-004 (in-progress)". */
  withheld: Map<string, string>;
  /** Doc path → the ticket that requires it to be present. */
  required: Map<string, string>;
  /** Gated tickets that declared no `paths:` at all. Warned about, never silent. */
  unresolved: string[];
}

let statusGateCache: StatusGate | null = null;
let statusLogged = false;

/**
 * Read every ticket in `specsDir` and resolve its lifecycle status onto doc paths.
 *
 * A no-op unless `docs.statusGating` is configured AND this is a deploy build: locally the
 * whole corpus is the point, and a project with no published surface has nothing to gate.
 */
function statusGate(): StatusGate {
  if (statusGateCache) return statusGateCache;
  const withheld = new Map<string, string>();
  const required = new Map<string, string>();
  const unresolved: string[] = [];
  if (!STATUS_GATING || !CLOUD_BUILD) return (statusGateCache = { withheld, required, unresolved });

  const dir = resolve(REPO, SPECS_DIR);
  let names: string[] = [];
  try {
    names = readdirSync(dir).filter((n) => TICKET_FILE_RE.test(n));
  } catch {
    return (statusGateCache = { withheld, required, unresolved });
  }
  for (const name of names) {
    let data: Record<string, unknown> = {};
    try {
      data = matter(readFileSync(resolve(dir, name), "utf8")).data;
    } catch {
      continue;
    }
    const status = String(data.status ?? "");
    const withhold = WITHHOLD_STATUSES.has(status);
    const requirePresent = REQUIRE_STATUSES.has(status);
    if (!withhold && !requirePresent) continue;
    const label = `${data.id ?? name.replace(/\.md$/, "")} (${status})`;

    // `paths: []` is a declaration in its own right and is honoured as one: this ticket
    // gates nothing, deliberately. Tickets that produce no page at all (a restructure, a
    // deliverable handed over directly) would otherwise sit in the unresolved list
    // permanently, and a list that is never empty is a list nobody reads.
    if (!Array.isArray(data.paths)) {
      unresolved.push(label);
      continue;
    }
    for (const p of (data.paths as unknown[]).map(String).filter(Boolean)) {
      if (withhold) withheld.set(p, label);
      else required.set(p, label);
    }
  }
  return (statusGateCache = { withheld, required, unresolved });
}

/**
 * Section/group for a repo-relative posix path (drives the finder grouping).
 * First matching `groups[i].match` prefix wins; else specs dir → "Feature Library";
 * else "Docs".
 */
function groupOf(p: string): string {
  for (const g of GROUPS) {
    if (p.startsWith(g.match)) return g.label;
  }
  if (p === SPECS_DIR || p.startsWith(SPECS_DIR + "/")) return "Feature Library";
  return "Docs";
}

/** Derive a human title: explicit override → front-matter title → first H1 → filename. */
function titleOf(p: string, fm: Record<string, unknown>, body: string): string {
  if (TITLE_OVERRIDES[p]) return TITLE_OVERRIDES[p];
  if (typeof fm.title === "string" && fm.title.trim()) return fm.title.trim();
  const h1 = body.match(/^#\s+(.+?)\s*$/m);
  if (h1) return h1[1].replace(/[`*_]/g, "");
  return p.split("/").pop() ?? p;
}

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function collectDir(abs: string, acc: string[]) {
  try {
    for (const e of readdirSync(abs, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const full = resolve(abs, e.name);
      if (e.isDirectory()) {
        if (!IGNORE.has(e.name)) collectDir(full, acc);
      } else if (e.isFile() && e.name.endsWith(".md")) {
        acc.push(full);
      }
    }
  } catch {
    /* unreadable dir: skip */
  }
}

let corpusLogged = false;

/**
 * Read + front-matter-parse every doc across the repo at build/dev time, dropping
 * anything a deploy build must not carry.
 *
 * Two filters, answering two different questions, and both only on a deploy build:
 * `deployExclude` (which paths are internal) and `statusGate()` (how far along the work
 * is). The numbers get printed rather than assumed, because a rule that silently matches
 * nothing, or everything, should be visible in the build log.
 */
function loadDocs() {
  const files: string[] = [];
  for (const d of RECURSE_DIRS) collectDir(resolve(REPO, d), files);
  for (const f of ROOT_FILES) {
    const abs = resolve(REPO, f);
    try {
      if (statSync(abs).isFile()) files.push(abs);
    } catch {
      /* missing optional root file */
    }
  }
  const gate = statusGate();
  const hitsByRule = DEPLOY_EXCLUDE.map(() => 0);
  const withheldByStatus: string[] = [];
  const seen = new Set<string>();
  const docs = [];
  for (const abs of files) {
    const path = toPosix(relative(REPO, abs));
    if (seen.has(path)) continue;
    seen.add(path);
    let raw = "";
    try {
      raw = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    // Parse front-matter defensively: a single doc with a malformed `---` YAML block
    // (e.g. a template, a Jekyll post, or a stray horizontal rule) must not crash the
    // whole portal build. Fall back to treating the file as body-only.
    let data: Record<string, unknown> = {};
    let body = raw.trim();
    try {
      const parsed = matter(raw);
      data = parsed.data;
      body = parsed.content.trim();
    } catch {
      /* malformed front-matter: keep raw body, empty data */
    }
    const rule = excludedBy(path);
    if (rule >= 0) {
      hitsByRule[rule] += 1;
      continue;
    }
    // Work in progress: on the local portal for review, off the published site.
    const gateReason = gate.withheld.get(path);
    if (gateReason) {
      withheldByStatus.push(`${path} · ${gateReason}`);
      continue;
    }
    docs.push({ path, group: groupOf(path), title: titleOf(path, data, body), data, body });
  }

  if (CLOUD_BUILD) {
    // The audience has been pointed at these. Shipping a site that is missing one is
    // worse than not shipping, so this fails the build rather than warning.
    const keptPaths = new Set(docs.map((d) => d.path));
    const missing = [...gate.required]
      .filter(([p]) => !keptPaths.has(p))
      .map(
        ([p, label]) =>
          `${p} · ${label}${existsSync(resolve(REPO, p)) ? " (withheld by docs.deployExclude)" : " (file does not exist)"}`,
      );
    if (missing.length) {
      throw new Error(
        `[spec-kit-docs] ${missing.length} deliverable(s) have reached the audience but are absent from the deploy bundle:\n` +
          missing.map((m) => `  · ${m}`).join("\n") +
          `\nEither the doc is missing, or a docs.deployExclude rule is withholding it. Fix one of ` +
          `those, or move the ticket out of ${[...REQUIRE_STATUSES].join("/")}.`,
      );
    }
  }

  // loadDocs() runs several times per build (once per virtual-module load, plus every hot
  // reload); say all of this once.
  if (!corpusLogged) {
    corpusLogged = true;
    if (!CLOUD_BUILD) {
      console.log(
        `[spec-kit-docs] target=local · ${docs.length} docs · deployExclude and statusGating NOT applied (full corpus)`,
      );
    } else {
      const dropped = hitsByRule.reduce((a, b) => a + b, 0) + withheldByStatus.length;
      console.log(`[spec-kit-docs] target=cloud · ${docs.length} docs included, ${dropped} withheld`);
      DEPLOY_EXCLUDE.forEach((rule, i) => console.log(`[spec-kit-docs]   − ${hitsByRule[i]} doc(s) · ${rule}`));
      for (const w of withheldByStatus) console.log(`[spec-kit-docs]   − ${w} · by ticket status`);
    }
  }
  // A gate that cannot resolve a ticket has to say so. Warned every time rather than
  // once, and separately from the banner above: this is the one failure mode of the gate
  // that looks exactly like success, and it stays visible until the ticket declares a
  // `paths:` list (`paths: []` if it genuinely gates nothing).
  if (!statusLogged && gate.unresolved.length) {
    statusLogged = true;
    for (const label of gate.unresolved) {
      console.warn(
        `[spec-kit-docs] WARN statusGating: ${label} has no paths: key, so it gates nothing. ` +
          `Add paths: [...] to the ticket, or paths: [] if it deliberately gates nothing.`,
      );
    }
  }
  return docs;
}

/** Group order for the finder: configured group labels (in order), then the
 *  implicit "Feature Library" and "Docs" buckets. App.tsx appends any others. */
function groupOrder(): string[] {
  const ordered: string[] = [];
  for (const g of GROUPS) if (!ordered.includes(g.label)) ordered.push(g.label);
  for (const g of ["Feature Library", "Docs"]) if (!ordered.includes(g)) ordered.push(g);
  return ordered;
}

/** The config the app reads via `import config from "virtual:spec-config"`. */
function appConfig() {
  return {
    name: cfg.name,
    specsDir: SPECS_DIR,
    // `theme` reaches the app so `CdlPageContainer` can set `data-theme` on <html>;
    // `null` travels as null, meaning base CDL greyscale and no attribute at all.
    branding: { theme: cfg.branding?.theme ?? null, accent: cfg.branding?.accent },
    docs: {
      home: cfg.docs?.home,
      groups: GROUPS,
      groupOrder: groupOrder(),
    },
  };
}

/** Expose the parsed docs to the app as `import docs from "virtual:docs"`. */
function docsPlugin() {
  const id = "virtual:docs";
  const resolved = "\0" + id;
  return {
    name: "spec-kit-docs",
    resolveId(source: string) {
      return source === id ? resolved : null;
    },
    load(loadId: string) {
      return loadId === resolved ? `export default ${JSON.stringify(loadDocs())}` : null;
    },
    configureServer(server: import("vite").ViteDevServer) {
      // Hot-reload the virtual module when any tracked .md changes.
      server.watcher.add(REPO);
      server.watcher.on("all", (_evt: string, file: string) => {
        if (file.replace(/\\/g, "/").endsWith(".md")) {
          const mod = server.moduleGraph.getModuleById(resolved);
          if (mod) server.reloadModule(mod);
        }
      });
    },
  };
}

/** Expose the parsed config as `import config from "virtual:spec-config"`. */
function configPlugin() {
  const id = "virtual:spec-config";
  const resolved = "\0" + id;
  return {
    name: "spec-kit-config",
    resolveId(source: string) {
      return source === id ? resolved : null;
    },
    load(loadId: string) {
      return loadId === resolved ? `export default ${JSON.stringify(appConfig())}` : null;
    },
  };
}

export default defineConfig({
  // `@tailwindcss/vite` replaces the v3 PostCSS pipeline: there is no tailwind.config.js
  // and no postcss.config.js, and everything the old config expressed now lives in
  // `src/index.css` (`@theme`, `@source`, `@custom-variant`).
  plugins: [react(), tailwindcss(), docsPlugin(), configPlugin()],
  // `@/…` → `src/…`, matching tsconfig `paths` and `components.json`. Every CDL component
  // imports itself that way, so `npx shadcn add` output resolves with no edits.
  resolve: { alias: { "@": resolve(here, "src") } },
});

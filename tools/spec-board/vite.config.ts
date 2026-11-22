import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import matter from "gray-matter";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(here, "../.."); // tools/spec-board → repo root

/** Escape a string for safe interpolation into a RegExp source. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Project config (spec-kit.config.json at the repo root) with defaults applied. */
function loadConfig() {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(readFileSync(resolve(REPO, "spec-kit.config.json"), "utf8"));
  } catch {
    raw = {};
  }
  const branding =
    raw.branding && typeof raw.branding === "object"
      ? (raw.branding as { theme?: string | null; accent?: string })
      : {};
  return {
    name: typeof raw.name === "string" ? raw.name : "Project",
    prefix: typeof raw.prefix === "string" ? raw.prefix : "TICKET",
    specsDir: typeof raw.specsDir === "string" ? raw.specsDir : "specs",
    lifecycle: Array.isArray(raw.lifecycle)
      ? (raw.lifecycle as string[])
      : ["backlog", "in-progress", "pending-review", "shipped"],
    impacts: Array.isArray(raw.impacts) ? (raw.impacts as string[]) : [],
    branding: {
      // `theme` may legitimately be null, so `??` rather than `||`: an explicit null is
      // the deliberate "base CDL greyscale, set no data-theme" answer, not a missing value.
      theme: branding.theme ?? null,
      accent: branding.accent,
    },
  };
}

const cfg = loadConfig();
const SPECS_DIR = resolve(REPO, cfg.specsDir || "specs");
const SPEC_FILE_RE = new RegExp("^" + escapeRegex(cfg.prefix) + "-.*\\.md$");
/** The rolling recap `/spec-recap` writes. Generated content, not a ticket. */
const RECAP_FILE = resolve(SPECS_DIR, "RECAP.md");

/** Read + front-matter-parse every <specsDir>/<PREFIX>-*.md at build/dev time. */
function loadSpecs() {
  let files: string[] = [];
  try {
    files = readdirSync(SPECS_DIR).filter((f) => SPEC_FILE_RE.test(f));
  } catch {
    return [];
  }
  return files
    .map((file) => {
      const { data, content } = matter(readFileSync(resolve(SPECS_DIR, file), "utf8"));
      return { file, body: content.trim(), ...data } as Record<string, unknown>;
    })
    .sort((a, b) => String(a.id ?? "").localeCompare(String(b.id ?? "")));
}

/**
 * Read `<specsDir>/RECAP.md` raw. No front-matter parsing: the recap is plain markdown
 * whose first lines happen to carry `updated:` / `window:` stamps, and the Copy button
 * hands over exactly what is on disk. Absent is a normal state (`/spec-recap` has never
 * run), so it reports `exists: false` rather than throwing.
 */
function loadRecap(): { exists: boolean; raw: string; mtime: string | null } {
  try {
    const raw = readFileSync(RECAP_FILE, "utf8");
    return { exists: true, raw, mtime: statSync(RECAP_FILE).mtime.toISOString() };
  } catch {
    return { exists: false, raw: "", mtime: null };
  }
}

/**
 * Expose three virtual modules to the app:
 *   - `import specs from "virtual:specs"`        → the parsed tickets (hot-reloaded)
 *   - `import config from "virtual:spec-config"` → the parsed project config + defaults
 *   - `import recap from "virtual:spec-recap"`   → <specsDir>/RECAP.md, raw (hot-reloaded)
 */
function specsPlugin() {
  const specsId = "virtual:specs";
  const specsResolved = "\0" + specsId;
  const configId = "virtual:spec-config";
  const configResolved = "\0" + configId;
  const recapId = "virtual:spec-recap";
  const recapResolved = "\0" + recapId;
  return {
    name: "spec-board-specs",
    resolveId(source: string) {
      if (source === specsId) return specsResolved;
      if (source === configId) return configResolved;
      if (source === recapId) return recapResolved;
      return null;
    },
    load(loadId: string) {
      if (loadId === specsResolved) return `export default ${JSON.stringify(loadSpecs())}`;
      if (loadId === configResolved) return `export default ${JSON.stringify(cfg)}`;
      if (loadId === recapResolved) return `export default ${JSON.stringify(loadRecap())}`;
      return null;
    },
    configureServer(server: import("vite").ViteDevServer) {
      server.watcher.add(SPECS_DIR);
      const specsSeg = "/" + (cfg.specsDir || "specs") + "/";
      server.watcher.on("all", (_evt: string, file: string) => {
        // One watcher, both modules: a ticket edit and a recap rewrite land in the same
        // directory, and reloading the pair is cheaper than telling them apart.
        if (file.replace(/\\/g, "/").includes(specsSeg)) {
          for (const id of [specsResolved, recapResolved]) {
            const mod = server.moduleGraph.getModuleById(id);
            if (mod) server.reloadModule(mod);
          }
        }
      });
    },
  };
}

/**
 * Dev-server-only middleware that exposes `coord.sh status --json` at `/coord-status`.
 * The static build has no server, so LiveStrip degrades gracefully when this is absent.
 */
function coordStatusPlugin() {
  const COORD_SH = resolve(here, "../spec-coord/coord.sh");
  return {
    name: "spec-board-coord-status",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/coord-status", (_req, res) => {
        try {
          const out = execFileSync("bash", [COORD_SH, "status", "--json"], {
            cwd: resolve(here, "../.."), // repo root (git operations need this)
            timeout: 5000,
            encoding: "utf8",
          });
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
          res.end(out);
        } catch {
          // coord.sh not available, git not initialised, or timed out: return empty status
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end('{"sessions":[],"locks":[],"queue":[],"worktrees":[]}');
        }
      });
    },
  };
}

// `@tailwindcss/vite` replaces the v3 PostCSS pipeline: there is no tailwind.config.js
// and no postcss.config.js, and everything that used to live in them is expressed in
// `src/index.css` (`@import "tailwindcss"`, `@plugin`, `@custom-variant`).
export default defineConfig({
  plugins: [react(), tailwindcss(), specsPlugin(), coordStatusPlugin()],
});

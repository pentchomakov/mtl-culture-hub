#!/usr/bin/env node
// check:cdl — the app is built on the Compass Design Library shell, and stays there.
//
// Copied into <app>/scripts/check-cdl.mjs by spec-init's frontend scaffold and exposed as
// `npm run check:cdl`. It runs from the app directory and walks up for spec-kit.config.json.
//
// Six checks, each guarding a rule that has a habit of eroding:
//   1. every page under src/pages/ uses CdlPageContainer as its shell
//   2. src/styles/cdl-tokens.css matches the registry's published tokens
//   3. the client theme overlay is actually applied (data-theme), when one is configured
//   4. the sidebar factory imports no lucide-react (nav icons are Phosphor)
//   5. components.json keeps "iconLibrary": "phosphor"
//   6. index.css still gives the app the viewport, so the document cannot rubber-band
//
// A guard that fires on a plane is a guard that gets deleted, so the one network check WARNS
// and skips when the registry is unreachable. Everything else is local and fails closed.
//
// Usage: node scripts/check-cdl.mjs [--self-test]
//        CDL_REGISTRY=https://... node scripts/check-cdl.mjs

import { readFileSync, existsSync, readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { tmpdir } from "node:os";
import { createServer } from "node:http";

// Read late, not at import: the self-test points this at a local server, and a const captured at load
// time would make the network check untestable without a live registry.
const registry = () =>
  (process.env.CDL_REGISTRY || "https://cdl-registry.compassdata.workers.dev").replace(/\/+$/, "");

function findConfig(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "spec-kit.config.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function loadConfig(appDir) {
  const path = findConfig(appDir);
  if (!path) return {};
  try {
    // Keys beginning with "//" are the config's comment idiom; JSON.parse keeps them, callers ignore them.
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return { __parseError: String(err && err.message ? err.message : err) };
  }
}

function walk(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

// Strip comments before matching source. A check that greps raw text passes on a page whose only
// mention of the shell is `// TODO: use CdlPageContainer`, which is the drift, not compliance.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

// --- the six checks --------------------------------------------------------

// 1. Every page is a CdlPageContainer page. The App style standard's hard rule: a page that rolls its
//    own wrapper drifts from the shell in ways no reviewer catches twice.
function checkPagesUseShell(appDir) {
  const pagesDir = join(appDir, "src", "pages");
  if (!existsSync(pagesDir)) {
    return { id: "pages-use-shell", ok: true, skipped: true, detail: "no src/pages/ yet" };
  }
  const pages = walk(pagesDir, ".tsx").filter((p) => !p.endsWith(".test.tsx") && !p.endsWith(".stories.tsx"));
  if (pages.length === 0) {
    return { id: "pages-use-shell", ok: true, skipped: true, detail: "src/pages/ holds no .tsx pages" };
  }
  // The JSX open tag, over stripped source. A substring match passes on
  // `// TODO: use CdlPageContainer`, which is the exact drift this check exists to catch: the
  // page that talks about the shell and does not use it.
  const offenders = pages.filter((p) => !/<\s*CdlPageContainer[\s/>]/.test(stripComments(readFileSync(p, "utf8"))));
  return offenders.length === 0
    ? { id: "pages-use-shell", ok: true, detail: `${pages.length} page(s) use CdlPageContainer` }
    : {
        id: "pages-use-shell",
        ok: false,
        detail:
          `${offenders.length} page(s) do not use CdlPageContainer as their shell:\n` +
          offenders.map((p) => `    ${relative(appDir, p)}`).join("\n") +
          "\n  Every page's outermost element is CdlPageContainer. No custom layout wrapper.",
      };
}

// 2. Tokens match the registry. The tokens file is a mirror, so a local edit is a fork nobody declared.
async function checkTokensCurrent(appDir) {
  const local = join(appDir, "src", "styles", "cdl-tokens.css");
  if (!existsSync(local)) {
    return { id: "tokens-current", ok: false, detail: "src/styles/cdl-tokens.css is missing" };
  }
  let remote;
  try {
    const res = await fetch(`${registry()}/tokens.css`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    remote = await res.text();
  } catch (err) {
    return {
      id: "tokens-current",
      ok: true,
      warn: true,
      detail: `registry unreachable (${err && err.message ? err.message : err}); token freshness not checked`,
    };
  }
  if (!/--background|--sidebar/.test(remote)) {
    return { id: "tokens-current", ok: true, warn: true, detail: "registry returned something that is not a token sheet; skipped" };
  }
  return readFileSync(local, "utf8") === remote
    ? { id: "tokens-current", ok: true, detail: "tokens match the registry" }
    : {
        id: "tokens-current",
        ok: false,
        detail:
          "src/styles/cdl-tokens.css differs from the registry's tokens.\n" +
          "  Refresh it with `npm run sync:cdl` (tokens are data and safe to replace).",
      };
}

// 3. The configured overlay is actually applied. branding.theme naming a slug that no code sets is a
//    client that paid for a theme and got the default.
function checkThemeApplied(appDir, config) {
  const theme = config && config.branding ? config.branding.theme : null;
  if (!theme) return { id: "theme-applied", ok: true, skipped: true, detail: "branding.theme is null; base tokens are the design" };
  const sources = walk(join(appDir, "src"), ".tsx").concat(walk(join(appDir, "src"), ".ts"));
  // The slug has to be the value that reaches data-theme, not merely a string that appears
  // somewhere in src/. Two shapes count, because both are how CDL applies a theme:
  //   theme="<slug>" passed to CdlPageContainer (which sets the attribute for you), or
  //   data-theme set directly, in a file that also names the slug.
  const themeProp = new RegExp(`theme=\\{?\\s*["'\`]${theme.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`]`);
  const wiredVia = sources.filter((p) => {
    const src = stripComments(readFileSync(p, "utf8"));
    return themeProp.test(src) || (/data-theme/.test(src) && src.includes(theme));
  });
  const overlayExists = existsSync(join(appDir, "src", "themes", `${theme}.css`));
  return wiredVia.length > 0 && overlayExists
    ? { id: "theme-applied", ok: true, detail: `"${theme}" is wired (${relative(appDir, wiredVia[0])}) and its overlay exists` }
    : {
        id: "theme-applied",
        ok: false,
        detail:
          `branding.theme is "${theme}" but the app does not apply it: ` +
          (wiredVia.length === 0
            ? `nothing in src/ passes theme="${theme}" or sets data-theme to it`
            : `src/themes/${theme}.css is missing`) +
          `.\n  Pass theme="${theme}" to CdlPageContainer (or set data-theme on <html>) and import ` +
          `src/themes/${theme}.css after the tokens.`,
      };
}

// 4. Nav icons are Phosphor. Two icon libraries in one bundle is the drift this catches early.
function checkSidebarIcons(appDir) {
  const factory = join(appDir, "src", "app", "sidebar.tsx");
  if (!existsSync(factory)) return { id: "sidebar-icons", ok: true, skipped: true, detail: "no src/app/sidebar.tsx" };
  const lines = readFileSync(factory, "utf8").split("\n");
  const bad = lines
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    .filter(({ line }) => /^import[\s\S]*["']lucide-react["']/.test(line) || /from\s+["']lucide-react["']/.test(line));
  return bad.length === 0
    ? { id: "sidebar-icons", ok: true, detail: "sidebar factory imports no lucide-react" }
    : {
        id: "sidebar-icons",
        ok: false,
        detail:
          "src/app/sidebar.tsx imports lucide-react; nav icons are Phosphor:\n" +
          bad.map(({ n, line }) => `    ${n}: ${line}`).join("\n"),
      };
}

// 5. components.json keeps phosphor. The upstream template ships lucide, the scaffold rewrites it, and a
//    primitive re-sync can quietly put it back.
function checkComponentsJson(appDir) {
  const path = join(appDir, "components.json");
  if (!existsSync(path)) return { id: "components-icon-library", ok: true, skipped: true, detail: "no components.json" };
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return { id: "components-icon-library", ok: false, detail: `components.json does not parse: ${err.message}` };
  }
  return parsed.iconLibrary === "phosphor"
    ? { id: "components-icon-library", ok: true, detail: 'components.json iconLibrary is "phosphor"' }
    : {
        id: "components-icon-library",
        ok: false,
        detail:
          `components.json iconLibrary is ${JSON.stringify(parsed.iconLibrary ?? null)}, expected "phosphor".\n` +
          "  A re-synced primitive set can reset this; set it back rather than importing lucide.",
      };
}

// 6. The app owns the viewport. The CDL shell is a fixed-height frame whose content area is the only
//    scroller. If the DOCUMENT can scroll too, a downward drag on macOS rubber-bands the whole frame
//    and shows the browser canvas above it: the sidebar slips down and a pale band appears over the
//    rail. It reads as a rendering bug in the shell and it is three declarations away.
function checkOwnsViewport(appDir) {
  const css = join(appDir, "src", "index.css");
  if (!existsSync(css)) {
    return { id: "app-owns-viewport", ok: true, skipped: true, detail: "no src/index.css yet" };
  }
  // Stripped, because the rule's own explanatory comment quotes the declarations it asserts. A raw
  // grep therefore passes on a file whose CSS has been edited out from under the comment — the first
  // version of this check in a real project did exactly that and had to be rewritten.
  const src = stripComments(readFileSync(css, "utf8"));
  const missing = [];
  if (!/html\s*,\s*body\s*,\s*#root\s*\{[^}]*height\s*:\s*100%/.test(src)) missing.push("html, body, #root { height: 100% }");
  if (!/html\s*,\s*body\s*\{[^}]*overflow\s*:\s*hidden/.test(src)) missing.push("html, body { overflow: hidden }");
  if (!/overscroll-behavior\s*:\s*none/.test(src)) missing.push("html, body { overscroll-behavior: none }");
  return missing.length === 0
    ? { id: "app-owns-viewport", ok: true, detail: "the document cannot scroll or rubber-band" }
    : {
        id: "app-owns-viewport",
        ok: false,
        detail:
          `src/index.css is missing ${missing.length} viewport rule(s):\n` +
          missing.map((m) => `    ${m}`).join("\n") +
          "\n  Without them a drag on the page slides the whole shell and shows the canvas behind it.",
      };
}

async function run(appDir) {
  const config = loadConfig(appDir);
  const results = [
    checkPagesUseShell(appDir),
    await checkTokensCurrent(appDir),
    checkThemeApplied(appDir, config),
    checkSidebarIcons(appDir),
    checkComponentsJson(appDir),
    checkOwnsViewport(appDir),
  ];
  return results;
}

function report(results) {
  let failed = 0;
  for (const r of results) {
    const mark = !r.ok ? "FAIL" : r.warn ? "WARN" : r.skipped ? "skip" : "ok  ";
    console.log(`  [${mark}] ${r.id}: ${r.detail}`);
    if (!r.ok) failed++;
  }
  console.log(
    failed === 0
      ? `check:cdl — ${results.length} check(s), all clear`
      : `check:cdl — ${failed} of ${results.length} check(s) FAILED`
  );
  return failed;
}

// --- self test -------------------------------------------------------------
// Builds fixtures on disk and asserts each check catches its own regression. The registry check is
// exercised against a local file through CDL_REGISTRY-independent comparison, so the self-test needs
// no network: a passing token case writes the bytes the check will read back, and the failing case
// mutates them.

async function selfTest() {
  const root = mkdtempSync(join(tmpdir(), "check-cdl-selftest-"));
  const cases = [];
  const record = (name, pass) => {
    cases.push({ name, pass });
    console.log(`  ${pass ? "caught " : "MISSED "} ${name}`);
  };

  const app = (name) => {
    const dir = join(root, name);
    mkdirSync(join(dir, "src", "pages"), { recursive: true });
    mkdirSync(join(dir, "src", "app"), { recursive: true });
    mkdirSync(join(dir, "src", "styles"), { recursive: true });
    mkdirSync(join(dir, "src", "themes"), { recursive: true });
    writeFileSync(join(dir, "components.json"), JSON.stringify({ iconLibrary: "phosphor" }, null, 2));
    writeFileSync(join(dir, "src", "styles", "cdl-tokens.css"), ":root{--background:x;--sidebar:y}\n");
    writeFileSync(
      join(dir, "src", "index.css"),
      "@layer base{html,body,#root{height:100%}html,body{overflow:hidden;overscroll-behavior:none}}\n"
    );
    writeFileSync(
      join(dir, "src", "pages", "overview.tsx"),
      "export default () => <CdlPageContainer>ok</CdlPageContainer>\n"
    );
    writeFileSync(join(dir, "src", "app", "sidebar.tsx"), 'import { House } from "@phosphor-icons/react"\n');
    return dir;
  };

  // 1. pages-use-shell
  let dir = app("pages-good");
  record("pages-use-shell passes on a compliant page", checkPagesUseShell(dir).ok === true);
  dir = app("pages-bad");
  writeFileSync(join(dir, "src", "pages", "rogue.tsx"), "export default () => <div className='p-8'>nope</div>\n");
  const pagesBad = checkPagesUseShell(dir);
  record("pages-use-shell fails on a custom wrapper", pagesBad.ok === false && /rogue\.tsx/.test(pagesBad.detail));
  dir = app("pages-comment-only");
  writeFileSync(
    join(dir, "src", "pages", "talks.tsx"),
    "// TODO: use CdlPageContainer here\nexport default () => <div className='p-8'>not yet</div>\n",
  );
  const pagesComment = checkPagesUseShell(dir);
  record(
    "pages-use-shell fails on a page that only mentions the shell in a comment",
    pagesComment.ok === false && /talks\.tsx/.test(pagesComment.detail),
  );

  // 2. tokens-current, driven through the real code path against a local registry so the fetch,
  //    the sanity gate and the comparison are all genuinely exercised.
  const served = ":root{--background:x;--sidebar:y}\n";
  // Two servers, because the checked URL is always `<registry>/tokens.css`: the only way to make
  // that path answer with something that is NOT a token sheet is a second origin whose own
  // /tokens.css serves other content. Pointing the registry at a subpath instead just 404s, which
  // exercises the unreachable branch and leaves the sanity gate untested.
  const server = createServer((req, res) => {
    if (req.url === "/tokens.css") res.writeHead(200, { "content-type": "text/css" }).end(served);
    else res.writeHead(404).end();
  });
  const impostor = createServer((req, res) => {
    if (req.url === "/tokens.css") res.writeHead(200, { "content-type": "text/html" }).end("<!doctype html><title>login</title>\n");
    else res.writeHead(404).end();
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  await new Promise((ok) => impostor.listen(0, "127.0.0.1", ok));
  const port = server.address().port;
  const impostorPort = impostor.address().port;
  const priorRegistry = process.env.CDL_REGISTRY;
  process.env.CDL_REGISTRY = `http://127.0.0.1:${port}`;

  dir = app("tokens-good");
  writeFileSync(join(dir, "src", "styles", "cdl-tokens.css"), served);
  record("tokens-current passes when tokens match the registry", (await checkTokensCurrent(dir)).ok === true);

  dir = app("tokens-bad");
  writeFileSync(join(dir, "src", "styles", "cdl-tokens.css"), ":root{--background:LOCAL-EDIT;--sidebar:y}\n");
  const tokensBad = await checkTokensCurrent(dir);
  record("tokens-current fails on a local edit", tokensBad.ok === false && /sync:cdl/.test(tokensBad.detail));

  dir = app("tokens-missing");
  rmSync(join(dir, "src", "styles", "cdl-tokens.css"));
  record("tokens-current fails when the file is missing", (await checkTokensCurrent(dir)).ok === false);

  // the sanity gate: a 200 that is not a token sheet must not be treated as authoritative.
  // Asserted on the message, not on {ok, warn}, because the unreachable branch returns the same
  // shape and would let this case pass while the gate itself was gone.
  process.env.CDL_REGISTRY = `http://127.0.0.1:${impostorPort}`;
  dir = app("tokens-notsheet");
  const notSheet = await checkTokensCurrent(dir);
  record(
    "tokens-current refuses to trust a 200 that is not a token sheet",
    notSheet.ok === true && notSheet.warn === true && /not a token sheet/.test(notSheet.detail),
  );

  // and the genuinely-offline case, which must warn rather than fail: a closed port.
  await new Promise((ok) => impostor.close(ok));
  process.env.CDL_REGISTRY = `http://127.0.0.1:${impostorPort}`;
  dir = app("tokens-offline");
  const offline = await checkTokensCurrent(dir);
  record(
    "tokens-current warns rather than failing when the registry is unreachable",
    offline.ok === true && offline.warn === true && /unreachable/.test(offline.detail),
  );

  process.env.CDL_REGISTRY = priorRegistry === undefined ? "" : priorRegistry;
  if (priorRegistry === undefined) delete process.env.CDL_REGISTRY;
  await new Promise((ok) => server.close(ok));

  // 3. theme-applied
  dir = app("theme-good");
  writeFileSync(join(dir, "src", "themes", "acme.css"), 'html[data-theme="acme"]{--primary:oklch(.5 .1 250)}\n');
  writeFileSync(join(dir, "src", "app", "theme.ts"), 'document.documentElement.setAttribute("data-theme", "acme")\n');
  record(
    "theme-applied passes when the overlay is wired",
    checkThemeApplied(dir, { branding: { theme: "acme" } }).ok === true
  );
  dir = app("theme-bad");
  record(
    "theme-applied fails when the slug is configured but unused",
    checkThemeApplied(dir, { branding: { theme: "acme" } }).ok === false
  );
  record("theme-applied skips when theme is null", checkThemeApplied(dir, { branding: { theme: null } }).skipped === true);
  // the hole the tightened check closes: the overlay exists, data-theme is set, and the value set
  // is the BASE theme rather than the client's.
  dir = app("theme-wrong-slug");
  writeFileSync(join(dir, "src", "themes", "acme.css"), 'html[data-theme="acme"]{--primary:oklch(.5 .1 250)}\n');
  writeFileSync(join(dir, "src", "app", "theme.ts"), 'document.documentElement.setAttribute("data-theme", "compass")\n');
  writeFileSync(join(dir, "src", "pages", "note.tsx"), "// acme branding tracked in NW-001\nexport default () => <CdlPageContainer/>\n");
  const wrongSlug = checkThemeApplied(dir, { branding: { theme: "acme" } });
  record("theme-applied fails when data-theme is set to another theme", wrongSlug.ok === false);

  // 4. sidebar-icons
  dir = app("icons-good");
  record("sidebar-icons passes on a Phosphor import", checkSidebarIcons(dir).ok === true);
  dir = app("icons-bad");
  writeFileSync(join(dir, "src", "app", "sidebar.tsx"), 'import { Home } from "lucide-react"\n');
  const iconsBad = checkSidebarIcons(dir);
  record("sidebar-icons fails on a lucide-react import", iconsBad.ok === false && /lucide-react/.test(iconsBad.detail));

  // 5. components-icon-library
  dir = app("cj-good");
  record("components-icon-library passes on phosphor", checkComponentsJson(dir).ok === true);
  dir = app("cj-bad");
  writeFileSync(join(dir, "components.json"), JSON.stringify({ iconLibrary: "lucide" }, null, 2));
  record("components-icon-library fails on lucide", checkComponentsJson(dir).ok === false);

  // 6. app-owns-viewport
  dir = app("viewport-good");
  record("app-owns-viewport passes on a compliant base layer", checkOwnsViewport(dir).ok === true);
  dir = app("viewport-bad");
  writeFileSync(
    join(dir, "src", "index.css"),
    "@layer base{html,body,#root{height:100%}html,body{overflow:hidden;overscroll-behavior:auto}}\n"
  );
  const viewportBad = checkOwnsViewport(dir);
  record(
    "app-owns-viewport fails when the document can rubber-band",
    viewportBad.ok === false && /overscroll-behavior/.test(viewportBad.detail),
  );
  dir = app("viewport-comment-only");
  writeFileSync(
    join(dir, "src", "index.css"),
    "/* html, body, #root { height: 100% } and html, body { overflow: hidden; overscroll-behavior: none } */\nbody{margin:0}\n"
  );
  record("app-owns-viewport fails when only a comment claims the rule", checkOwnsViewport(dir).ok === false);

  rmSync(root, { recursive: true, force: true });
  const missed = cases.filter((c) => !c.pass);
  console.log(
    missed.length === 0
      ? `check-cdl --self-test: ${cases.length}/${cases.length} PASSED`
      : `check-cdl --self-test: ${missed.length} case(s) MISSED`
  );
  return missed.length === 0 ? 0 : 1;
}

const main = async () => {
  if (process.argv.includes("--self-test")) process.exit(await selfTest());
  const appDir = process.cwd();
  console.log(`check:cdl — ${appDir}`);
  process.exit(report(await run(appDir)) === 0 ? 0 : 1);
};

main().catch((err) => {
  console.error(`check:cdl — crashed: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Refresh CDL's base design tokens from the design-library registry.
 *
 * `src/styles/cdl-tokens.css` is a MIRROR, not ours: CDL is the source of truth for the
 * palette and the `@theme` maps that make `bg-primary`-style utilities exist, and it
 * serves that file verbatim at `/tokens.css`. Without a refresh path the portal's palette
 * silently drifts from CDL's and renders subtly wrong colours.
 *
 * Deliberately narrow, and tokens ONLY. CDL's own primitive sync also rewrites every
 * shadcn component; this project installs primitives through `npx shadcn add` per
 * component and `cdl-app-sidebar.tsx` carries documented local edits (`hideSettings`,
 * `hideAutoTheme`, the generalised defaults), so a blanket overwrite would clobber them
 * without warning. Tokens are data and safe to replace; components are not.
 *
 * Run on demand, when CDL changes its palette, not on every build.
 *
 *   npm run sync:cdl
 *   CDL_REGISTRY=https://… npm run sync:cdl   # point at a different registry
 */

import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY = process.env.CDL_REGISTRY ?? "https://cdl-registry.compassdata.workers.dev";
const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, "../src/styles/cdl-tokens.css");

const res = await fetch(`${REGISTRY}/tokens.css`);
if (!res.ok) {
  console.error(`[sync-cdl] ${REGISTRY}/tokens.css → HTTP ${res.status}. Tokens left unchanged.`);
  process.exit(1);
}
const next = await res.text();
if (!/--background|--sidebar/.test(next)) {
  console.error("[sync-cdl] response does not look like CDL tokens (no --background/--sidebar). Aborting.");
  process.exit(1);
}

let prev = "";
try {
  prev = readFileSync(target, "utf8");
} catch {
  /* first run */
}
if (prev === next) {
  console.log("[sync-cdl] tokens already current, no change.");
} else {
  writeFileSync(target, next);
  console.log(`[sync-cdl] wrote src/styles/cdl-tokens.css (${next.length} bytes, was ${prev.length}).`);
}

const version = await fetch(`${REGISTRY}/version.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
if (version) console.log(`[sync-cdl] registry version ${version.version} (built ${version.builtAt}).`);

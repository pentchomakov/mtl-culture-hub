#!/usr/bin/env node
/**
 * Mirror shadcn primitives from the Compass Design Library (CDL) — the source of
 * truth — into this project's src/components/ui/.
 *
 * CDL publishes <CDL_REGISTRY_URL>/primitives.json with, for each primitive it
 * uses, the exact file content + versioned npm deps. This script writes those
 * files verbatim and installs the deps, so the template mirrors CDL's tested
 * primitives — not whatever (possibly incompatible) version shadcn upstream
 * happens to serve today.
 *
 * It only writes the primitives CDL ships. It never deletes anything, so one-off
 * primitives added inside a project (e.g. from a local component build) are left
 * untouched.
 *
 * Usage:
 *   node scripts/sync-cdl-primitives.mjs
 */

import { execSync } from "node:child_process"
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const REGISTRY_URL = (
  process.env.CDL_REGISTRY_URL ?? "https://cdl-registry.compassdata.workers.dev"
).replace(/\/$/, "")

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, "..")

const res = await fetch(`${REGISTRY_URL}/primitives.json`)
if (!res.ok) {
  console.error(`✗ Failed to fetch ${REGISTRY_URL}/primitives.json — ${res.status}`)
  process.exit(1)
}
const { primitives } = await res.json()
if (!Array.isArray(primitives) || !primitives.length) {
  console.error("✗ primitives.json had no primitives")
  process.exit(1)
}

let changed = 0
const deps = {}
for (const p of primitives) {
  const dest = resolve(ROOT, "src", p.path)
  mkdirSync(dirname(dest), { recursive: true })
  const prev = existsSync(dest) ? readFileSync(dest, "utf8") : null
  if (prev !== p.content) {
    changed++
    console.log(`  ${prev === null ? "added" : "updated"}: ${p.path}`)
  }
  writeFileSync(dest, p.content)
  Object.assign(deps, p.dependencies ?? {})
}

console.log(`Mirrored ${primitives.length} primitive(s) from CDL — ${changed} changed.`)

const args = Object.entries(deps).map(([k, v]) => `${k}@${v}`)
if (args.length) {
  console.log(`Installing deps: ${args.join(" ")}`)
  execSync(`npm install ${args.join(" ")}`, { stdio: "inherit", cwd: ROOT })
}

// Mirror CDL's base design tokens (the palette + @theme maps) the same way as
// primitives: write the file verbatim. index.css imports ./styles/cdl-tokens.css, so
// the project's tokens always match CDL. Project-specific CSS (fonts, brand theme,
// base layer) stays in index.css and is untouched.
try {
  const tres = await fetch(`${REGISTRY_URL}/tokens.css`)
  if (tres.ok) {
    const css = await tres.text()
    const dest = resolve(ROOT, "src/styles/cdl-tokens.css")
    mkdirSync(dirname(dest), { recursive: true })
    const prev = existsSync(dest) ? readFileSync(dest, "utf8") : null
    writeFileSync(dest, css)
    console.log(`  ${prev === null ? "added" : prev === css ? "unchanged" : "updated"}: src/styles/cdl-tokens.css`)
  } else {
    console.warn(`⚠ Could not fetch tokens.css (${tres.status}) — primitives synced, tokens skipped.`)
  }
} catch {
  console.warn("⚠ Could not fetch tokens.css — primitives synced, tokens skipped.")
}

// Record the CDL version we just synced, so `npm run cdl:status` can tell whether
// this project is current. (Best-effort — don't fail the sync if it's unreachable.)
try {
  const vres = await fetch(`${REGISTRY_URL}/version.json`)
  if (vres.ok) {
    const v = await vres.json()
    writeFileSync(
      resolve(ROOT, "cdl.lock"),
      JSON.stringify(
        { cdlVersion: v.version, cdlBuiltAt: v.builtAt, syncedAt: new Date().toISOString() },
        null,
        2
      )
    )
    console.log(`Recorded CDL version ${v.version} in cdl.lock`)
  }
} catch {
  /* version stamp is optional */
}

console.log("✓ Primitives and design tokens mirrored from CDL")

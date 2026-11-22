#!/usr/bin/env node
/**
 * Report whether this project is current with the Compass Design Library (CDL).
 *
 * Compares the CDL version recorded in cdl.lock (written by the primitive sync)
 * against the live version at <CDL_REGISTRY_URL>/version.json.
 *
 * Usage:
 *   node scripts/cdl-status.mjs
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const REGISTRY_URL = (
  process.env.CDL_REGISTRY_URL ?? "https://cdl-registry.compassdata.workers.dev"
).replace(/\/$/, "")

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const lockPath = resolve(ROOT, "cdl.lock")
const day = (iso) => (iso || "").slice(0, 10)

const res = await fetch(`${REGISTRY_URL}/version.json`)
if (!res.ok) {
  console.error(`✗ Couldn't reach CDL (${res.status}).`)
  process.exit(1)
}
const latest = await res.json()

if (!existsSync(lockPath)) {
  console.log(`This project has not synced from CDL yet.`)
  console.log(`Latest CDL: ${latest.version} (${day(latest.builtAt)}).`)
  console.log(`Run: npm run sync:cdl-primitives`)
  process.exit(0)
}

const lock = JSON.parse(readFileSync(lockPath, "utf8"))

if (lock.cdlVersion === latest.version) {
  console.log(`✓ Up to date with CDL — ${latest.version} (${day(latest.builtAt)}).`)
  process.exit(0)
}

console.log(`⚠ Behind CDL.`)
console.log(`   You have:  ${lock.cdlVersion} (${day(lock.cdlBuiltAt)})`)
console.log(`   Latest is: ${latest.version} (${day(latest.builtAt)})`)
console.log(``)
console.log(`   Refresh primitives:  npm run sync:cdl-primitives`)
console.log(`   CDL components you use may also have updates — re-add them:`)
console.log(`     npx shadcn@latest add ${REGISTRY_URL}/r/<name>.json --overwrite`)

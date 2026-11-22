---
name: cdl-primitive-sync
description: Refresh this project's shadcn UI primitives and base design tokens so they match the Compass Design Library (CDL), the source of truth. Use when the user asks to sync, refresh, or update CDL primitives or tokens, or after CDL has changed a primitive or a token value. Scope is narrow — it syncs primitive components (src/components/ui) and the base token file (src/styles/cdl-tokens.css) from CDL; it does not touch CDL components or anything else.
user-invocable: true
---

# Sync CDL primitives

## What this does

The shadcn UI primitives in `src/components/ui/` (button, input, sheet, dialog, …)
**and the base design tokens** in `src/styles/cdl-tokens.css` (the color palette +
`@theme` maps) are **mirrored from the Compass Design Library (CDL)** — CDL is the
source of truth. This skill pulls CDL's current primitive files + token file and
installs the matching dependency versions, so this project matches what CDL tests
against.

It is intentionally narrow: it syncs primitives and the base token file. It does not
modify CDL components, app code, brand themes, or anything else. It writes
`src/styles/cdl-tokens.css` (imported by `index.css`); the rest of `index.css`
— fonts, brand-theme imports, base layer — is left untouched.

## When to use it

- The user says "sync / refresh / update CDL primitives" (or similar).
- After someone changes a primitive in CDL and you want this project current.
- You don't need it routinely — clones of the template already ship with CDL's
  primitives. This is for the occasional refresh.

## How to run it

1. Run the sync:

   ```bash
   npm run sync:cdl-primitives
   ```

   This fetches CDL's primitive bundle from
   `https://cdl-registry.compassdata.workers.dev/primitives.json`, writes each
   primitive file into `src/components/ui/`, installs the versioned deps, and writes
   CDL's base tokens to `src/styles/cdl-tokens.css` (from `/tokens.css`).
   It **only writes the primitives + token file CDL ships and never deletes anything**,
   so any one-off primitives added inside this project are left untouched.

2. Verify nothing broke:

   ```bash
   npm run build
   ```

   The sync also records the CDL version it pulled in `cdl.lock`. To check whether
   this project is current with CDL at any time (without syncing), run
   `npm run cdl:status` — it reports "up to date" or "behind."

3. Report back in plain language: which primitives changed and whether
   `cdl-tokens.css` changed (the script prints `added`/`updated`/`unchanged` lines),
   whether the build passed, and — if any dependency versions changed — mention that
   so the user knows to keep them.

## If the build fails after syncing

A primitive update can occasionally pull a dependency change that doesn't agree
with this project (the classic case is `calendar` + `react-day-picker`). If the
build breaks:
- Show the user the error plainly.
- Don't hand-patch CDL's primitive files to work around it — that defeats the
  point of CDL being the source of truth.
- Flag it as something to fix in CDL (the design library), then re-sync.

## What this skill does NOT do

- It does not install or update CDL **components** (CdlDataTable, CdlPageContainer,
  etc.) — those come from the registry via `shadcn add`.
- It syncs CDL's **base** tokens (`src/styles/cdl-tokens.css` — the shared palette and
  `@theme` maps). It does **not** manage the rest of `index.css` (fonts, `@source`
  paths, base layer) or the **brand themes** (`src/themes/*.css`, the `data-theme`
  overlays) — those are this project's own choices and stay put.

<!-- Mirrored from compassanalytics/compass-app-template (.claude/skills/cdl-primitive-sync) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->

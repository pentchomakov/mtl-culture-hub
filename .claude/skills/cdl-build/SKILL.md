---
name: cdl-build
description: Builds a page or feature using exclusively CDL components and shadcn primitives available in the repo. Flags any missing components before writing any code and waits for approval.
user-invocable: true
---

# CDL Build

## Purpose

Build UI using only what already exists in the Compass Design Library and the shadcn/ui primitives in this repo. Do not invent new components, do not install new packages, do not write one-off styled divs that duplicate existing component logic. If a requirement implies something that doesn't exist yet, flag it explicitly and wait for approval before proceeding.

**Prefer enhancing an existing component over forking a local copy.** If an existing CDL component *almost* satisfies a requirement but is missing one slot, prop, or behavior, do **not** silently fork a page-local copy that duplicates it. Stop and flag it — a small, general enhancement to the shared component (a new optional prop or render slot) is almost always the right call, and it keeps every consumer on one implementation. See Step 3.

---

## Step 1: Understand the Requirement

Read the user's description of what needs to be built. Extract:
- The page or section being built
- Every distinct UI element mentioned (tables, cards, charts, dialogs, forms, etc.)
- Any data requirements (static mock data is fine)
- Any layout requirements (grid, fill-height, fixed, scrollable)

**If the requirement comes from a client brief or a requirements document, stop and run `cdl-demo-audit` mode 1 first.** Briefs are consulting deliverables: their screen boundaries and screen counts come from the review-session format, not from the users. Build from that skill's approved route map, not from the brief's screen list. If a plan file already exists at `docs/briefs/<client>/<demo>/plan.md`, read it and build from it.

---

## Step 2: Inventory Available Components

Do **not** rely on a memorized component list — inventory from the live sources every time:

- `src/components/cdl/index.ts` — the authoritative list of exported CDL components. Read it first.
- `src/components/cdl/layout/cdl-page-container.tsx` — page shell reference.
- `.claude/skills/cdl-use/SKILL.md` — the full requirement → component mapping table and per-component prop reference. Consult it for props, composition patterns, and which component fits a given need.
- `ls src/components/ui/` — the shadcn primitives available in this repo (Button, Badge, Input, Dialog, Tooltip, etc.). Check a primitive's source for its variants before using it.

---

## Step 3: Map Requirements → Components

Before writing any code, produce a mapping table:

| Requirement | TN / shadcn Component | Notes |
|---|---|---|
| ... | ... | ... |

Classify every requirement into one of three outcomes:

**✅ Fully satisfied** — an existing component covers it as-is. Use it.

**🚩 Missing entirely** — nothing existing comes close.
- State exactly what is missing
- Propose the simplest solution (new CDL component, shadcn primitive, or, only if genuinely one-off and un-generalizable, a local component)
- **Stop and wait for user approval before proceeding**

**🚩 Partially satisfied (close, but needs a small change)** — an existing component would fit if it had one more prop, slot, or behavior. This is the trap that leads to duplicated forks. Do **not** copy the component into the page and tweak it.
- Name the existing component and state precisely what it lacks (e.g. "CdlMessageList has no slot for per-message rich content")
- Propose the smallest **general** enhancement to the shared component (an optional prop or `render*` slot), designed so other consumers benefit and existing call sites are unaffected
- Note that enhancing a CDL component means following the `cdl-create-component` flow (story, tsc gate, registry rebuild)
- **Stop and wait for user approval before proceeding**

Do not write any code until all 🚩 items are resolved. When in doubt between forking locally and enhancing the shared component, stop and flag rather than fork.

---

## Step 4: Build

**Read `.claude/skills/cdl-design-standards/SKILL.md` before writing any code, and apply every rule in its catalog.** Some of its rules also change Step 3's mapping — status fields and longform-copy columns map differently than the naive reading of a brief suggests — so read it before the mapping table is final, not after.

**For any page under `/demo/*`, also read `.claude/skills/cdl-demo-conventions/SKILL.md` and the client overlay skill for that suite** (e.g. `guidance-air-canada` for `/demo/air-canada/*`). Those state what the demo must contain and which of those defaults the suite changes; the order the layers win in is stated in `cdl-demo`. Read them in full — a summary here would drift from them.

Once all requirements are mapped and any gaps are approved:

**Every page must use `CdlPageContainer` as its outermost shell.** Do not build a custom layout wrapper. `CdlPageContainer` provides the sidebar, breadcrumb header, nav tab bar, and main content area. Pass `title`, `segments`, `sidebar`, `navLinks`, `onNavLinkChange`, `overflow`, and `contentClassName` as needed.

- Import `CdlPageContainer` from `@/components` (barrel)
- Import `CdlBlockGroup`, `CdlBlockHeader`, `CdlBlockContent`, `CdlBlockFooter` from `@/components/cdl/layout/cdl-block-group`
- Import all other TN components directly from their source files
- Use realistic mock data — domain-appropriate values, not lorem ipsum
- Do not add any color styling, font styling, or theming (no custom `text-*`, `bg-*`, `font-*`, or CSS variable overrides). Leave that to a separate theming step.
- KPI grids → `grid grid-cols-{n} gap-4`
- Height-fill layout when needed → `overflow="hidden"` on `CdlPageContainer` + `flex-1 min-h-0` on `CdlBlockGroup` children
- Charts filling height → `height="100%"` on chart component + `CdlBlockContent className="p-4 min-h-0"` on the wrapper
- Chart series/slice colors → always use CSS variables `var(--chart-1)` through `var(--chart-5)`, never hardcoded hex values. This ensures colors respond to dark mode and per-page themes. The default palette is a grayscale ramp (light mode: dark→light; dark mode: light→dark). Use `--chart-1` for the primary series, `--chart-2` through `--chart-5` for additional series in order.

---

## Step 5: Report

After writing the file, output:
- Every requirement and what it mapped to (✅ or 🚩)
- File path written
- Any deferred items that still need follow-up

---

## Step 6: Audit the build

**For any page under `/demo/*`, run `cdl-demo-audit` mode 2 on the route base you just built.** It checks the routes against the approved map, marks every coverage-ledger entry, walks `cdl-demo-conventions` across the demo, and folds in the `cdl-design-standards` review of each page.

- Run it once per demo, after the last page of the batch — not once per file.
- Fix what it reports, then state what you fixed and what you left.
- Skip it for a one-line copy change to a page that already passed.

A build is not finished until mode 2 runs clean, or until the user accepts the findings that remain.

<!-- Mirrored from compassanalytics/compass-design-library (.claude/skills/cdl-build) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->

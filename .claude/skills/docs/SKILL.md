---
name: docs
description: >
  Open the local documentation portal — the Vite+React viewer (tools/docs-site/) that renders every project
  doc the config points at (docs.recurseDirs, docs.rootFiles, and the specs tickets) with a finder sidebar,
  Mermaid/GFM/code rendering, and a configurable home page as its landing index. Use when the user says
  "open the docs", "docs site", "documentation portal", "view the docs", or "/docs". Boots the Vite dev
  server in the background and opens it in the browser; read-only (never mutates docs or git).
argument-hint: ""
allowed-tools: Bash, Read
---

# docs — open the documentation portal

Launch `tools/docs-site/` (Vite + React; a `virtual:docs` plugin reads the repo markdown described by
`spec-kit.config.json`'s `docs` block and hot-reloads as docs change). It is **read-only** viewing — it
never edits docs or git. (To *update* docs from code, use the `docs-update` skill; to *search* them
programmatically, use `docs-lookup`.)

The portal's corpus and grouping are entirely config-driven: it recurses `docs.recurseDirs[]` for `*.md`,
includes `docs.rootFiles[]`, always includes `<specsDir>/`, groups by `docs.groups[]`, and lands on
`docs.home` (falling back to the first root file). You don't pass paths here — the viewer reads the config.

## Step 0 — Config + tool guard (do this first)
1. Read **`spec-kit.config.json`** at the repo root. If it is missing, this project hasn't been initialized
   — tell the user to run **`/spec-init`** and stop. Note `name`, `docs.home`, and `docs.recurseDirs` for
   the report.
2. If **`tools/docs-site/`** is absent, the docs portal isn't scaffolded — tell the user to re-run
   `/spec-init` (repair mode restores it) and stop.

## Steps
1. **Already up?** Check `lsof -i:5173 -sTCP:LISTEN` (Vite's default). **Both viewers default to 5173**, so
   something listening there may be the spec board, not the docs site. Never assume the port: start the
   docs server (step 3) and open the URL **Vite actually prints**. Opening a guessed port is how a session
   ends up reviewing the wrong app and reporting on a page it never loaded.
2. **Deps.** If `tools/docs-site/node_modules` is missing, run `npm install` in `tools/docs-site/`.
3. **Start (background).** From `tools/docs-site/`, run `npm run docs` with `run_in_background: true` (a
   long-lived dev server — never run it in the foreground, it won't return).
4. **Find the real URL.** Read the background process output for the `➜  Local:   http://localhost:PORT/`
   line — Vite bumps to 5174+ if 5173 is busy. Use that exact URL.
5. **Open + report.** `open <URL>` (macOS). Tell the user the portal is live, read-only, and hot-reloads as
   any tracked `.md` changes; the home is `docs.home` (the configured index), with a finder sidebar over
   every doc in the corpus. Leave the server running in the background.

## Guardrails
- Read-only: do not edit docs, run git, or deploy from this skill.
- Don't spawn a second server if one is already serving the docs site (reuse the printed URL).
- **Report the URL Vite printed**, not the one you expected. Both viewers default to 5173, so the second
  one to start lands on 5174+.

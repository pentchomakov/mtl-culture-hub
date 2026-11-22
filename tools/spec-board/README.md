# spec-board: read-only backlog viewer

A tiny local Vite app that renders the spec tickets in your project's specs directory as a backlog
board (one column per lifecycle status, with impact chips, branch/deps visibility, a tag filter, an
AI-proposed panel, and a Summary of where the project stands). **Read-only**: it never writes. Edit
tickets in the specs directory (or via the spec skills). Not deployed.

```bash
cd tools/spec-board
npm install
npm run board        # → http://localhost:5173
```

## Driven by `spec-kit.config.json`

Everything comes from the config at the repo root:

- `name` → the in-app wordmark (`<name> Specs`)
- `prefix` → the ticket id prefix; only `<prefix>-*.md` files are loaded
- `specsDir` → which directory the tickets (and `RECAP.md`) live in
- `lifecycle` → the board columns, in order
- `impacts` → the impact-chip taxonomy, and the order the chips appear in
- `branding.theme` → a registered brand-theme id, set as `data-theme` on `<html>`. `null` (the
  default) sets no attribute and the base greyscale stands, which is a design rather than a gap. The
  overlay CSS that a `data-theme` selector matches belongs to the project, not to this tool
- `branding.accent` → predates the theme seam; still tints the wordmark when no theme is set

Tickets are read + front-matter-parsed at dev/build time by the `virtual:specs` Vite plugin
(`vite.config.ts`); the config arrives as `virtual:spec-config` and the recap as `virtual:spec-recap`.
Editing anything in the specs directory hot-reloads the board.

## The tag filter

**Tags** in the toolbar opens a row per family: **Impacts**, **Who**, **Flags**. Any tag within a row
matches (OR); every row with a selection must match (AND). A count beside each chip answers "what
would I get by adding this tag", so it is narrowed by the other rows but not by its own.

Families appear only when they have something to say. **Flags** is absent until an AI, annotation,
sign-off or hotfix ticket exists. **Who** needs two distinct logins in `who:` across the tickets: on a
solo project the row would repeat the same name on every card and filter nothing.

`status` is deliberately not a family. It is already the columns.

Adding a project-specific axis takes three edits: the front-matter key in the ticket template, the
field on `Spec` in `src/specs.d.ts`, and one entry in `FAMILIES` in `src/facets.ts`. A family with
many values (one per service, per module, per client) should set `collapsible` and a `unit` so the
panel does not grow a forty-chip row.

## Summary

**Summary** in the header renders `<specsDir>/RECAP.md` (Now / Just done / Next, written by
`/spec-recap`) with the file's `updated:` stamp under the title and a **Copy** button that hands over
the raw markdown for pasting into a status update. When the recap has never been generated the modal
says so and names the command. Escape closes.

## Theme

The board is on the CDL token set (`src/styles/cdl-tokens.css`, byte-identical to the docs portal's
copy) with Tailwind v4: no `tailwind.config.js`, no `postcss.config.js`, and everything those held now
expressed in `src/index.css`. The Light / Dark / Auto control in the header stores the choice under
`cdl-color-mode` and writes `.dark` on `<html>`; Auto follows the OS and keeps following it.

Impact chips, flag badges and the live-session pills keep chromatic Tailwind classes, each paired with
a dark variant: the token set is greyscale by design, and those are the places where hue carries the
meaning.

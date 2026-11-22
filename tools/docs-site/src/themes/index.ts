/**
 * The brand-theme seam.
 *
 * Base CDL is greyscale, and that IS the design: with no theme registered the portal
 * renders on `src/styles/cdl-tokens.css` alone, no `data-theme` attribute is set, and
 * nothing here needs to exist. A brand theme is an addition, never a prerequisite.
 *
 * ── ADDING ONE ────────────────────────────────────────────────────────────────
 * A theme is ONE CSS file that re-declares CDL tokens under an attribute selector, plus
 * two lines of registration. It sets tokens; it never writes rules for components.
 *
 * 1. Write `src/themes/<id>.css`. Redeclare only the tokens the brand actually changes,
 *    and redeclare the dark variants under the same selector plus `.dark`:
 *
 *      html[data-theme="acme"] {
 *        --primary: oklch(0.50 0.13 253);
 *        --primary-foreground: oklch(0.985 0 0);
 *        --ring: oklch(0.56 0.13 253);
 *        --sidebar: oklch(0 0 0);
 *        --sidebar-foreground: oklch(0.985 0 0);
 *        --sidebar-primary: oklch(0.50 0.13 253);
 *        --font-sans: "Acme Sans", system-ui, sans-serif;
 *      }
 *      html[data-theme="acme"].dark {
 *        --sidebar-primary: oklch(0.65 0.12 253);
 *        --ring: oklch(0.61 0.12 253);
 *      }
 *
 *    Both blocks are needed. A theme that sets only the light values leaves the dark
 *    mode half-branded, which reads as a bug rather than as a choice.
 *
 * 2. `@import "./themes/acme.css";` in `src/index.css`, directly after the
 *    `cdl-tokens.css` import. Order is load-bearing: the overlay has to come after the
 *    tokens it overrides.
 *
 * 3. Add `"acme"` to `CdlTheme` and to `CDL_THEMES` below.
 *
 * 4. Set `"branding": { "theme": "acme" }` in `spec-kit.config.json`. The app forwards it
 *    to `CdlPageContainer theme=…`, which sets `data-theme` on `<html>` (on `<html>`
 *    rather than a wrapper, so themed tokens reach Radix portals: dialogs, popovers,
 *    tooltips). `null` sets no attribute and the base greyscale stands.
 */

/**
 * A registered theme id, as it appears in `data-theme` and in `branding.theme`.
 *
 * `string` while the registry is empty, because a kit that ships no themes cannot name
 * one. **Narrow it to a union the moment you add the first theme** (`export type CdlTheme
 * = "acme" | "metro"`): then a typo in `spec-kit.config.json` is a compile error naming
 * the file, instead of an attribute nothing in the CSS matches and a page that renders
 * unthemed with no complaint.
 */
export type CdlTheme = string

export interface CdlThemeMeta {
  id: CdlTheme
  label: string
}

export const CDL_THEMES: readonly CdlThemeMeta[] = [] as const

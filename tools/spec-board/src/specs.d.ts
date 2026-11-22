declare module "virtual:specs" {
  export interface Spec {
    file: string;
    id: string;
    title: string;
    status: string;
    /** Authoritative impacted-surfaces list (project-defined taxonomy). */
    impacts?: string[];
    /** GitHub logins who have touched the ticket. Drives the `who` tag family, which
     *  renders only once a second login exists (a solo project shows no who row). */
    who?: string[];
    /** What the ticket gates on deploy. `[]` is a real answer: it gates nothing. */
    paths?: string[];
    /** Who authored the ticket. AI tickets are visually separated and never
     *  auto-prioritized; `annotation` is feedback raised through the review layer. */
    source?: "human" | "ai" | "annotation" | string;
    /** True iff the ticket requires an out-of-band sign-off before shipping. */
    requires_sim_signoff?: boolean;
    /** Fast-path flag: ships straight through, skipping the staging/testing gate. */
    hotfix?: boolean;
    branch?: string;
    deps?: string[];
    created?: string;
    body: string;
  }
  const specs: Spec[];
  export default specs;
}

declare module "virtual:spec-config" {
  export interface SpecConfig {
    /** Display name, used for the in-app wordmark (e.g. "<name> Specs"). */
    name: string;
    /** Ticket id prefix → files <prefix>-NNN-*.md. */
    prefix: string;
    /** Directory holding the spec markdown files (relative to repo root). */
    specsDir: string;
    /** Board columns, in order. Each value is a status string. */
    lifecycle: string[];
    /** Impact-chip taxonomy (project-defined, variable length). */
    impacts: string[];
    branding?: {
      /**
       * A registered brand-theme id, applied as `data-theme` on `<html>`. `null` means
       * base CDL greyscale, which is a design rather than a gap. The overlay CSS ships
       * with the project (see the docs portal's `src/themes/`), not with the board.
       */
      theme?: string | null;
      /** Legacy alias from before the theme seam. Only tints the wordmark. */
      accent?: string;
    };
  }
  const config: SpecConfig;
  export default config;
}

declare module "virtual:spec-recap" {
  export interface SpecRecap {
    /** False when `/spec-recap` has never run. Not an error: the board says so. */
    exists: boolean;
    /** `<specsDir>/RECAP.md` verbatim: what the Copy button hands over. */
    raw: string;
    /** File mtime, ISO. `null` when the file is absent. */
    mtime: string | null;
  }
  const recap: SpecRecap;
  export default recap;
}

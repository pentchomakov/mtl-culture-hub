declare module "virtual:docs" {
  export interface Doc {
    /** Repo-relative posix path, e.g. "docs/architecture/architecture.md". */
    path: string;
    /** Finder section, e.g. "Architecture". */
    group: string;
    /** Human title (front-matter title → first H1 → filename). */
    title: string;
    /** Parsed front-matter (specs carry id/status/impacts/…; most docs are {}). */
    data: Record<string, unknown> & {
      id?: string;
      status?: string;
      impacts?: string[];
      build?: string;
      branch?: string;
    };
    /** Markdown body (front-matter stripped). */
    body: string;
  }
  const docs: Doc[];
  export default docs;
}

declare module "virtual:spec-config" {
  export interface SpecConfig {
    /** Project name, used for the wordmark (e.g. `<name> Docs`). */
    name: string;
    /** Directory holding spec tickets (grouped as "Feature Library"). */
    specsDir: string;
    branding?: {
      /**
       * A registered CDL theme id, applied as `data-theme` on `<html>`. `null` means base
       * CDL greyscale, which is the default and a design rather than a gap. See
       * `src/themes/index.ts` for what registering one involves.
       */
      theme?: string | null;
      /** Legacy alias from before the theme seam. Read by nothing; `theme` is the key. */
      accent?: string;
    };
    docs?: {
      /** Default landing doc path (repo-relative). */
      home?: string;
      /** Ordered grouping rules; first matching prefix wins. */
      groups?: { match: string; label: string }[];
      /** Finder group order: configured labels, then "Feature Library", "Docs". */
      groupOrder?: string[];
    };
  }
  const config: SpecConfig;
  export default config;
}

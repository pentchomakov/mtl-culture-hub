import type { Spec } from "virtual:specs";
import config from "virtual:spec-config";

/**
 * Tag filtering for the board: the pure logic half (no React).
 *
 * Semantics: OR within a family, AND across families. Picking two impacts widens
 * (either one matches); adding a person then narrows. A family with nothing selected
 * imposes no constraint.
 *
 * `status` is deliberately not a family. It is already the kanban columns.
 */

export type FamilyKey = "impacts" | "who" | "flags";

export interface Family {
  key: FamilyKey;
  label: string;
  /** The values a ticket carries in this family (possibly none). */
  valuesOf: (s: Spec) => string[];
  /**
   * Below this many distinct values the family is dropped, even though it has some.
   * One value says the same thing about every ticket that carries it, so the row costs
   * a line of chrome and filters nothing. `who` uses it; see FAMILIES.
   */
  minValues?: number;
  /** Long families render collapsed, so the panel stays short. */
  collapsible?: boolean;
  /** Shown beside the label when collapsed, e.g. "40 services". */
  unit?: string;
}

/** `source: ai` / `source: annotation` and the two boolean flags are folded into one
 *  family, because each is a yes/no marker rather than a value list, and all four render as
 *  card badges. */
function flagsOf(s: Spec): string[] {
  const out: string[] = [];
  if ((s.source ?? "human") === "ai") out.push("ai");
  // Feedback raised through the local review annotation layer. A yes/no marker like the
  // others, so it belongs in this family rather than in a new one.
  if ((s.source ?? "human") === "annotation") out.push("annotation");
  if (s.requires_sim_signoff === true) out.push("sign-off");
  if (s.hotfix === true) out.push("hotfix");
  return out;
}

/**
 * The families, in panel order.
 *
 * This is the seam for a project-specific axis: add a front-matter key to the ticket
 * template, widen `Spec` in `specs.d.ts`, and add one entry here. A family with many
 * values (one per service, per module, per client) should set `collapsible` and a
 * `unit`, so the panel does not grow a forty-chip row.
 */
export const FAMILIES: Family[] = [
  { key: "impacts", label: "Impacts", valuesOf: (s) => s.impacts ?? [] },
  {
    key: "who",
    label: "Who",
    valuesOf: (s) => s.who ?? [],
    // A solo project shows no who row. With one login the family is pure noise: every
    // ticket carries it, so selecting it changes nothing on screen. Not collapsible:
    // a team is a handful of logins, and a click to reveal three chips is a worse trade
    // than the line it saves.
    minValues: 2,
  },
  { key: "flags", label: "Flags", valuesOf: flagsOf },
];

/** Flag values render with the same wording/glyph as the card badges. */
export const FLAG_LABEL: Record<string, string> = {
  ai: "AI",
  annotation: "✎ annotation",
  "sign-off": "🔍 sign-off",
  hotfix: "⚡ hotfix",
};

/** Family → chosen values. A missing or empty entry means "no constraint". */
export type Selection = Partial<Record<FamilyKey, string[]>>;

export const EMPTY_SELECTION: Selection = {};

export function selectionCount(sel: Selection): number {
  return FAMILIES.reduce((n, f) => n + (sel[f.key]?.length ?? 0), 0);
}

export function toggleValue(sel: Selection, key: FamilyKey, value: string): Selection {
  const cur = sel[key] ?? [];
  return {
    ...sel,
    [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
  };
}

/** OR within one family: satisfied by carrying any chosen value (or by no choice). */
function matchesFamily(s: Spec, f: Family, chosen: string[]): boolean {
  if (chosen.length === 0) return true;
  const have = f.valuesOf(s);
  return chosen.some((v) => have.includes(v));
}

/** AND across families: every family with a selection must be satisfied. */
export function matchesFacets(s: Spec, sel: Selection): boolean {
  return FAMILIES.every((f) => matchesFamily(s, f, sel[f.key] ?? []));
}

// Impacts order by the configured taxonomy, so the chips read in the order the project
// declared them; unlisted values sort alphabetically after it. `who` is purely
// alphabetical, since logins have no project-declared order.
const TAXONOMY_RANK = new Map(config.impacts.map((v, i) => [v, i]));
const FLAG_RANK = new Map(["ai", "annotation", "sign-off", "hotfix"].map((v, i) => [v, i]));

function rankFor(key: FamilyKey): Map<string, number> | null {
  if (key === "impacts") return TAXONOMY_RANK;
  if (key === "flags") return FLAG_RANK;
  return null;
}

function compareValues(key: FamilyKey, a: string, b: string): number {
  const rank = rankFor(key);
  if (rank) {
    const ra = rank.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rb = rank.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
  }
  return a.localeCompare(b);
}

export interface FacetValue {
  value: string;
  /** How many tickets this value yields once added to the selection. */
  count: number;
  selected: boolean;
}

export interface Facet {
  family: Family;
  values: FacetValue[];
}

/**
 * Build the filter panel's facets.
 *
 * `all` is the whole corpus; `pool` is it already narrowed by the non-tag filters
 * (search + created-date). Three rules make the counts read the way you'd expect:
 *
 *  - A value appears iff some ticket **anywhere in the corpus** carries it, so
 *    buttons don't flicker in and out as you filter. A family with no values at all
 *    is dropped entirely, which is why "Flags" is absent until an AI or hotfix
 *    ticket exists, rather than showing four permanent zeroes.
 *  - A family below its `minValues` is dropped too, which is how a one-person project
 *    gets no "Who" row.
 *  - A count is narrowed by every family **except its own**, so it answers "what
 *    would I get by adding this tag" rather than restating the current result.
 */
export function buildFacets(all: Spec[], pool: Spec[], sel: Selection): Facet[] {
  return FAMILIES.map((family) => {
    const universe = new Set<string>();
    for (const s of all) for (const v of family.valuesOf(s)) universe.add(v);

    const others = pool.filter((s) =>
      FAMILIES.every((g) => g.key === family.key || matchesFamily(s, g, sel[g.key] ?? [])),
    );
    const chosen = sel[family.key] ?? [];

    const values = [...universe]
      .sort((a, b) => compareValues(family.key, a, b))
      .map((value) => ({
        value,
        count: others.filter((s) => family.valuesOf(s).includes(value)).length,
        selected: chosen.includes(value),
      }));

    return { family, values };
  }).filter((facet) => facet.values.length >= Math.max(1, facet.family.minValues ?? 1));
}

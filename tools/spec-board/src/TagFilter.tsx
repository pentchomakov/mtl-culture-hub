import { useState } from "react";
import type { Spec } from "virtual:specs";
import { impactChipClass } from "./chips";
import { cn } from "./lib/utils";
import {
  type Facet,
  type FacetValue,
  type FamilyKey,
  type Selection,
  EMPTY_SELECTION,
  FLAG_LABEL,
  buildFacets,
  selectionCount,
  toggleValue,
} from "./facets";

/**
 * The tag filter: the UI half. Semantics live in `facets.ts`.
 *
 * Exported as two pieces because they sit in different places in the layout: the
 * button belongs in the toolbar's flex row, the panel is full-width beneath it.
 * App holds the open + selection state alongside its other filter state.
 */

function labelFor(key: FamilyKey, value: string): string {
  return key === "flags" ? (FLAG_LABEL[value] ?? value) : value;
}

/** Toolbar toggle. Carries the active-filter count so a collapsed panel can't hide state. */
export function TagFilterButton({
  open,
  onToggle,
  selection,
}: {
  open: boolean;
  onToggle: () => void;
  selection: Selection;
}) {
  const n = selectionCount(selection);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
        open || n > 0
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-ring",
      )}
    >
      Tags
      {n > 0 && (
        <span className="rounded-full bg-primary-foreground/25 px-1.5 text-[10px] font-semibold">
          {n}
        </span>
      )}
      <span className="text-[9px] leading-none">{open ? "▲" : "▼"}</span>
    </button>
  );
}

function FacetButton({
  familyKey,
  familyLabel,
  v,
  onToggle,
}: {
  familyKey: FamilyKey;
  familyLabel: string;
  v: FacetValue;
  onToggle: () => void;
}) {
  // Nothing to gain from a zero-count value, unless it's selected, in which case
  // it must stay clickable so the selection can be undone.
  const dead = v.count === 0 && !v.selected;
  const text = labelFor(familyKey, v.value);
  const style = v.selected
    ? "border-primary bg-primary text-primary-foreground"
    : familyKey === "impacts"
      ? impactChipClass(v.value)
      : "border-border bg-card text-muted-foreground";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={dead}
      aria-pressed={v.selected}
      // The count is decorative beside the label; spell it out for screen readers
      // instead, since adjacent JSX would otherwise name the button "docs21". The
      // family prefix matters: two families can share a vocabulary, and then the value
      // alone names two different buttons.
      aria-label={`${familyLabel}: ${text}, ${v.count} ticket${v.count === 1 ? "" : "s"}`}
      className={cn(
        "rounded-lg border px-2 py-0.5 text-[12px] font-medium transition-colors",
        style,
        dead ? "cursor-default opacity-40" : "hover:ring-1 hover:ring-ring",
      )}
    >
      {text}
      <span
        aria-hidden="true"
        className={cn(
          "ml-1 text-[10px]",
          v.selected ? "text-primary-foreground/70" : "text-muted-foreground/70",
        )}
      >
        {v.count}
      </span>
    </button>
  );
}

function FamilyRow({ facet, onToggle }: { facet: Facet; onToggle: (value: string) => void }) {
  const { family, values } = facet;
  const chosen = values.filter((v) => v.selected);
  // A collapsible family starts open only if it already carries a selection, then
  // stays wherever the user puts it, so nothing reflows when the last value is deselected.
  const [open, setOpen] = useState(chosen.length > 0);
  const expanded = !family.collapsible || open;

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <div className="flex w-[86px] shrink-0 items-center gap-1">
        {family.collapsible ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <span className="text-[8px] leading-none">{open ? "▼" : "▶"}</span>
            {family.label}
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-muted-foreground">{family.label}</span>
        )}
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {expanded ? (
          values.map((v) => (
            <FacetButton
              key={v.value}
              familyKey={family.key}
              familyLabel={family.label}
              v={v}
              onToggle={() => onToggle(v.value)}
            />
          ))
        ) : (
          <>
            {/* Collapsed: still surface (and allow undoing) whatever is selected. */}
            {chosen.map((v) => (
              <FacetButton
                key={v.value}
                familyKey={family.key}
                familyLabel={family.label}
                v={v}
                onToggle={() => onToggle(v.value)}
              />
            ))}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-[12px] text-muted-foreground underline decoration-dotted hover:text-foreground"
            >
              {values.length} {family.unit ?? "values"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function TagFilterPanel({
  all,
  pool,
  selection,
  onChange,
}: {
  /** Whole corpus: fixes which buttons exist. */
  all: Spec[];
  /** Corpus narrowed by search + created-date only: drives the counts. */
  pool: Spec[];
  selection: Selection;
  onChange: (next: Selection) => void;
}) {
  const facets = buildFacets(all, pool, selection);
  if (facets.length === 0) return null;
  const n = selectionCount(selection);

  return (
    <div className="border-b border-border bg-muted/40 px-4 py-2.5">
      <div className="space-y-1.5">
        {facets.map((facet) => (
          <FamilyRow
            key={facet.family.key}
            facet={facet}
            onToggle={(value) => onChange(toggleValue(selection, facet.family.key, value))}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>Any tag within a row · all rows must match</span>
        {n > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_SELECTION)}
            className="font-medium underline decoration-dotted hover:text-foreground"
          >
            Clear tags
          </button>
        )}
      </div>
    </div>
  );
}

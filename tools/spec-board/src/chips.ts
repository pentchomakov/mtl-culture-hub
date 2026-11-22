import config from "virtual:spec-config";

/**
 * Chip colors for the impact taxonomy.
 *
 * The CDL token set is greyscale by design, so the impact chips keep chromatic Tailwind
 * classes: they are the one place on the board where hue carries meaning (which surface
 * a ticket touches), and six greys would carry none. Every entry pairs a light and a
 * dark treatment, because a `bg-sky-100 text-sky-700` chip on the dark canvas is
 * unreadable and a token-only fallback would lose the distinction entirely.
 */
const CHIP_PALETTE = ["sky", "teal", "amber", "violet", "rose", "lime"] as const;

// Full class strings, pre-listed so Tailwind's content scan keeps them: nothing here is
// assembled from fragments, because `bg-${color}-100` would generate no CSS at all.
export const CHIP_STYLE: Record<string, string> = {
  sky: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-900",
  teal: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-900",
  amber:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  violet:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900",
  rose: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
  lime: "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-900",
  // The fallback is token-based rather than a seventh hue: an unconfigured impact has no
  // place in the taxonomy, so it should read as chrome, not as a colour with a meaning.
  neutral: "bg-muted text-muted-foreground border-border",
};

// Map each configured impact → a palette color (cycled). Anything else → neutral.
const IMPACT_COLOR: Record<string, string> = Object.fromEntries(
  config.impacts.map((impact, i) => [impact, CHIP_PALETTE[i % CHIP_PALETTE.length]]),
);

/** Chip classes for an impact value, shared by the card chips and the tag filter. */
export function impactChipClass(impact: string): string {
  return CHIP_STYLE[IMPACT_COLOR[impact]] ?? CHIP_STYLE.neutral;
}

/** Subdued outline chip for the secondary axes (`who`), so they read as subordinate to
 *  the colored impact chips rather than competing with them. */
export const SUBDUED_CHIP = "border-border bg-muted text-muted-foreground";

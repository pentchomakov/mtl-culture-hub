/**
 * The rendered-markdown class string, shared by the ticket modal and the Summary modal.
 *
 * `prose-neutral` + `dark:prose-invert` rather than a coloured prose theme: the typography
 * plugin ships its own greys, and on the dark canvas the light ones are unreadable, so the
 * invert variant is not optional. Everything after that is the board's own restraint on
 * the plugin: `##` headings become small uppercase section labels, which is what a spec
 * ticket's `## Summary` / `## Acceptance` and a recap's `## Now` / `## Next` actually are,
 * and inline code sits on the muted token instead of the plugin's backtick quotes.
 */
export const PROSE = [
  "prose prose-neutral dark:prose-invert prose-sm max-w-none",
  "prose-headings:font-semibold",
  "prose-h2:mt-5 prose-h2:mb-2 prose-h2:text-[15px] prose-h2:uppercase prose-h2:tracking-wide prose-h2:text-muted-foreground",
  "prose-li:my-0.5",
  "prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-[12px] prose-code:font-normal",
  "prose-code:before:content-none prose-code:after:content-none",
  "prose-a:text-primary",
].join(" ");

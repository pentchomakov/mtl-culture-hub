import { type ReactNode, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import specs, { type Spec } from "virtual:specs";
import config from "virtual:spec-config";
import { LiveStrip } from "./LiveStrip";
import { Modal, ModalClose } from "./Modal";
import { RecapModal } from "./RecapModal";
import { ThemeToggle } from "./ThemeToggle";
import { SUBDUED_CHIP, impactChipClass } from "./chips";
import { TagFilterButton, TagFilterPanel } from "./TagFilter";
import { type Selection, EMPTY_SELECTION, matchesFacets, selectionCount } from "./facets";
import { cn } from "./lib/utils";
import { PROSE } from "./prose";

/** Humanize a status/lifecycle key into a Title Case label ("in-progress" → "In progress"). */
function humanize(key: string): string {
  const spaced = key.replace(/[-_]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// The human kanban: one column per lifecycle status, in config order.
// `proposed` and `rejected` are intentionally NOT columns (rendered as separate panels).
const STATUS_COLUMNS = config.lifecycle.map((key) => ({ key, label: humanize(key) }));

// Status labels for the detail modal: lifecycle columns plus the off-board states.
const STATUS_LABEL: Record<string, string> = {
  proposed: "Proposed",
  rejected: "Rejected",
  ...Object.fromEntries(config.lifecycle.map((key) => [key, humanize(key)])),
};

// A registered brand theme, or null. `null` is the deliberate "no theme" answer: base
// CDL greyscale, and no `data-theme` attribute set at all. The overlay CSS that a
// `data-theme` selector matches ships with the project, not with this template.
const THEME = config.branding?.theme ?? null;

// `branding.accent` predates the theme seam and only ever tinted the wordmark. Kept, so
// an older config still renders the way it did, with two sane fallbacks: a theme owns
// the palette (so the wordmark follows `--primary`), and with neither set the muted
// token is legible in both color modes.
const ACCENT_CLASS: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
  teal: "text-teal-600 dark:text-teal-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  rose: "text-rose-600 dark:text-rose-400",
};
const accent = config.branding?.accent;
const WORDMARK_ACCENT = THEME
  ? "text-primary"
  : ((accent && ACCENT_CLASS[accent]) || "text-muted-foreground");

function sourceOf(s: Spec): string {
  return s.source ?? "human";
}

function simSignoff(s: Spec): boolean {
  return s.requires_sim_signoff === true;
}

/** YAML parses unquoted dates to Date → ISO; show just the calendar date. */
function fmtDate(v: unknown): string {
  return String(v).slice(0, 10);
}

function firstParagraph(body: string): string {
  const m = body.replace(/^##\s*Summary\s*/i, "").split(/\n##\s/)[0];
  return m.replace(/^##.*$/gm, "").trim().split("\n\n")[0].slice(0, 280);
}

/** Numeric id for stable ordering (<PREFIX>-007 → 7); prefix-agnostic. */
function idNum(s: Spec): number {
  const m = /-(\d+)/.exec(s.id);
  return m ? parseInt(m[1], 10) : 0;
}

/** Created-date in ms (date-only → midnight UTC); NaN if absent/unparseable. */
function createdMs(s: Spec): number {
  if (!s.created) return NaN;
  const t = new Date(fmtDate(s.created) + "T00:00:00Z").getTime();
  return Number.isNaN(t) ? NaN : t;
}

/**
 * Sort by creation date, with the id number as the tiebreaker (and fallback for
 * undated tickets). Because ids are assigned highest+1, `id` order == creation order,
 * so "id #" (asc, default) shows oldest first and "newest" reverses to last-created on top.
 */
function sortSpecs(list: Spec[], sort: "id" | "newest"): Spec[] {
  const dir = sort === "newest" ? -1 : 1;
  return [...list].sort((a, b) => {
    const ca = createdMs(a);
    const cb = createdMs(b);
    if (!Number.isNaN(ca) && !Number.isNaN(cb) && ca !== cb) return (ca - cb) * dir;
    return (idNum(a) - idNum(b)) * dir;
  });
}

// Chromatic badge classes, each with a dark counterpart. These stay coloured for the
// same reason the impact chips do: the flag is the message, and four greys would say
// nothing. The `dark:` half is not decoration: a 100-level background carries near-white
// text on the dark canvas otherwise.
const BADGE = "rounded-full border px-2 py-0.5 text-[10px] font-semibold";
const BADGE_STYLE = {
  annotation:
    "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  ai: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  signoff:
    "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  hotfix:
    "border-orange-200 bg-orange-100 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
} as const;

function Badges({ s }: { s: Spec }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {sourceOf(s) === "annotation" && (
        <span
          title="Raised as an annotation on the local review portal"
          className={cn(BADGE, BADGE_STYLE.annotation)}
        >
          ✎ annotation
        </span>
      )}
      {sourceOf(s) === "ai" && <span className={cn(BADGE, BADGE_STYLE.ai)}>AI</span>}
      {simSignoff(s) && (
        <span title="Requires sign-off before shipping" className={cn(BADGE, BADGE_STYLE.signoff)}>
          🔍 sign-off
        </span>
      )}
      {s.hotfix && (
        <span
          title="Hotfix: fast-path, skips the staging gate"
          className={cn(BADGE, BADGE_STYLE.hotfix)}
        >
          ⚡ hotfix
        </span>
      )}
    </div>
  );
}

const PILL = "rounded border px-1.5 py-0.5 text-[10px] font-medium";

/**
 * The coloured `impacts` chips, optionally followed by the `who` logins as subdued
 * pills. Filtering by a person and then not being able to see whose card is whose would
 * make the who row half a feature, so the card carries it too. The modal passes
 * `secondary={false}` because it lists `who` as a labelled metadata row instead.
 */
function TagPills({ s, secondary = true }: { s: Spec; secondary?: boolean }) {
  const impacts = s.impacts ?? [];
  const who = secondary ? (s.who ?? []) : [];
  if (impacts.length === 0 && who.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {impacts.map((i) => (
        <span key={i} className={cn(PILL, impactChipClass(i))}>
          {i}
        </span>
      ))}
      {who.map((w) => (
        <span key={w} className={cn(PILL, SUBDUED_CHIP)}>
          @{w}
        </span>
      ))}
    </div>
  );
}

function Card({ s, onOpen, muted = false }: { s: Spec; onOpen: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full cursor-pointer rounded-xl border p-3 text-left shadow-sm transition-shadow",
        "hover:shadow-md hover:ring-2 hover:ring-ring/40 focus:outline-none focus:ring-2 focus:ring-ring",
        muted ? "border-dashed border-border bg-muted/40" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold text-muted-foreground">{s.id}</span>
        <Badges s={s} />
      </div>
      <div className="mt-1 text-[14px] font-semibold leading-snug text-foreground">{s.title}</div>
      <div className="mt-1.5">
        <TagPills s={s} />
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">
        {firstParagraph(s.body)}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {s.branch && <span className="font-mono">⎇ {s.branch}</span>}
        {s.deps && s.deps.length > 0 && <span>deps: {s.deps.join(", ")}</span>}
        {s.created && <span>{fmtDate(s.created)}</span>}
      </div>
    </button>
  );
}

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2 text-[12px]">
      <span className="w-20 shrink-0 font-medium text-muted-foreground">{label}</span>
      <span className="text-foreground">{children}</span>
    </div>
  );
}

function SpecModal({ s, onClose }: { s: Spec; onClose: () => void }) {
  return (
    <Modal onClose={onClose} labelledBy="spec-title">
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-semibold text-muted-foreground">
              {s.id}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {STATUS_LABEL[s.status] ?? s.status}
            </span>
          </div>
          <h2 id="spec-title" className="mt-1 text-lg font-bold leading-tight text-foreground">
            {s.title}
          </h2>
        </div>
        <ModalClose onClose={onClose} />
      </div>

      {/* metadata */}
      <div className="space-y-1.5 border-b border-border bg-muted/40 px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <TagPills s={s} secondary={false} />
          <Badges s={s} />
        </div>
        {s.who && s.who.length > 0 && (
          <MetaRow label="who">{s.who.map((w) => `@${w}`).join(", ")}</MetaRow>
        )}
        {s.branch && (
          <MetaRow label="branch">
            ⎇ <span className="font-mono">{s.branch}</span>
          </MetaRow>
        )}
        {s.deps && s.deps.length > 0 && <MetaRow label="deps">{s.deps.join(", ")}</MetaRow>}
        <MetaRow label="source">{sourceOf(s)}</MetaRow>
        {s.created && <MetaRow label="created">{fmtDate(s.created)}</MetaRow>}
        <MetaRow label="file">
          <span className="font-mono text-[11px]">
            {config.specsDir}/{s.file}
          </span>
        </MetaRow>
      </div>

      {/* full body, rendered markdown */}
      <div className="px-6 py-5">
        <article className={PROSE}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.body}</ReactMarkdown>
        </article>
      </div>
    </Modal>
  );
}

/** Toolbar segmented button. One place for the active/idle treatment. */
function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-ring",
      )}
    >
      {children}
    </button>
  );
}

export function App() {
  const [query, setQuery] = useState("");
  const [age, setAge] = useState<"all" | "recent24" | "recent" | "older">("all");
  const [sort, setSort] = useState<"id" | "newest">("id");
  const [tags, setTags] = useState<Selection>(EMPTY_SELECTION);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);
  const [selected, setSelected] = useState<Spec | null>(null);
  // Stable "now" so the created-date filter doesn't churn across renders.
  const [now] = useState(() => Date.now());

  // A brand theme is an attribute on <html>, not a wrapper class, so themed tokens also
  // reach anything portalled out of the React tree. `null` sets nothing and base CDL stands.
  useEffect(() => {
    if (THEME) document.documentElement.setAttribute("data-theme", THEME);
  }, []);

  const matchesQuery = (s: Spec) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.body.toLowerCase().includes(q)
    );
  };
  // Created-date buckets: "recent24" = last 24h, "recent" = last 7 days, "older" = beyond 7 days.
  const matchesAge = (s: Spec) => {
    if (age === "all") return true;
    if (!s.created) return false; // undated tickets show only under "All time"
    const created = new Date(fmtDate(s.created) + "T00:00:00Z").getTime();
    if (Number.isNaN(created)) return false;
    const delta = now - created;
    const DAY = 24 * 60 * 60 * 1000;
    if (age === "recent24") return delta <= DAY;
    if (age === "recent") return delta <= 7 * DAY;
    return delta > 7 * DAY; // "older"
  };
  // Two stages, because the tag facets need to count against the non-tag filters
  // only. Otherwise every unselected value in a family would read as 0.
  const pool = useMemo(() => specs.filter((s) => matchesQuery(s) && matchesAge(s)), [query, age]);
  const board = useMemo(() => pool.filter((s) => matchesFacets(s, tags)), [pool, tags]);

  // Partition by lifecycle: AI proposals + rejected live outside the human kanban.
  const proposed = useMemo(() => board.filter((s) => s.status === "proposed"), [board]);
  const rejected = useMemo(() => board.filter((s) => s.status === "rejected"), [board]);
  const shown = board.length;
  const filtered = query.trim() !== "" || age !== "all" || selectionCount(tags) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header: h-14, w-8 logo, accent wordmark, inline info, Summary + color mode. */}
      <header className="flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg shadow-sm" />
          <span className="text-[17px] font-bold tracking-tight text-foreground">
            {config.name} <span className={WORDMARK_ACCENT}>Specs</span>
          </span>
          <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
            · {specs.length} tickets · read-only
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setRecapOpen(true)}
            title="Where the project stands, from the latest /spec-recap"
            className="rounded-lg border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            Summary
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Filter toolbar: search + created-date filters + sort + tags. */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search id, title, or text…"
          aria-label="Search tickets"
          className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 sm:w-72"
        />
        <div className="flex gap-1.5">
          {(
            [
              ["all", "All time"],
              ["recent24", "Last 24h"],
              ["recent", "Last 7 days"],
              ["older", "Older than 7 days"],
            ] as const
          ).map(([key, label]) => (
            <ToolbarButton key={key} active={age === key} onClick={() => setAge(key)}>
              {label}
            </ToolbarButton>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">Sort</span>
          {(
            [
              ["id", "ID #"],
              ["newest", "Newest first"],
            ] as const
          ).map(([key, label]) => (
            <ToolbarButton key={key} active={sort === key} onClick={() => setSort(key)}>
              {label}
            </ToolbarButton>
          ))}
        </div>
        <TagFilterButton open={tagsOpen} onToggle={() => setTagsOpen(!tagsOpen)} selection={tags} />
        {filtered && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {shown} of {specs.length} shown
          </span>
        )}
      </div>

      {tagsOpen && <TagFilterPanel all={specs} pool={pool} selection={tags} onChange={setTags} />}

      <LiveStrip />

      {proposed.length > 0 && (
        <section className="border-b border-border bg-fuchsia-50/60 px-6 py-4 dark:bg-fuchsia-950/20">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-300">
              💡 Proposed by Claude · review &amp; approve
            </h2>
            <span className="rounded-full bg-fuchsia-200 px-1.5 text-[11px] font-semibold text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-200">
              {proposed.length}
            </span>
            <span className="text-[11px] text-muted-foreground">
              not in the build queue · approve with <code>/spec-approve {config.prefix}-NNN</code>
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortSpecs(proposed, sort).map((s) => (
              <Card key={s.id} s={s} muted onOpen={() => setSelected(s)} />
            ))}
          </div>
        </section>
      )}

      <main
        className="grid gap-3 p-6"
        style={{ gridTemplateColumns: `repeat(${STATUS_COLUMNS.length}, minmax(0, 1fr))` }}
      >
        {STATUS_COLUMNS.map((col) => {
          const items = sortSpecs(
            board.filter((s) => s.status === col.key),
            sort,
          );
          return (
            <section key={col.key}>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </h2>
                <span className="rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center text-[12px] text-muted-foreground">
                    Nothing here
                  </div>
                ) : (
                  items.map((s) => <Card key={s.id} s={s} onOpen={() => setSelected(s)} />)
                )}
              </div>
            </section>
          );
        })}
      </main>

      {rejected.length > 0 && (
        <details className="mx-6 mb-6 rounded-xl border border-border bg-card px-4 py-3">
          <summary className="cursor-pointer text-[12px] font-semibold text-muted-foreground">
            {/* Two different reasons land here. Declined AI proposals are the common case;
                the other is a ticket absorbed into another one, whose id is retired rather
                than reused. There is no `superseded` status, so both share this panel, and
                each ticket says which it is in its own Notes. */}
            Closed without shipping ({rejected.length}) · declined proposals and superseded tickets,
            kept so the ids are never reused and nothing is re-filed
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortSpecs(rejected, sort).map((s) => (
              <Card key={s.id} s={s} muted onOpen={() => setSelected(s)} />
            ))}
          </div>
        </details>
      )}

      {selected && <SpecModal s={selected} onClose={() => setSelected(null)} />}
      {recapOpen && <RecapModal onClose={() => setRecapOpen(false)} />}
    </div>
  );
}

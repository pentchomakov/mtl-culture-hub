---
name: cdl-design-standards
description: Design-standards rule catalog for demo pages built with CDL components. Load when building or modifying any demo page, or invoke with a page path to audit that page against every rule and report violations.
user-invocable: true
---

# CDL Design Standards

## Purpose

A catalog of recurring design mistakes that LLMs make when building demo pages with CDL components, each paired with the correct pattern. The rules are project-agnostic: they describe how to use CDL components, never the content of any specific demo.

This skill runs in two modes:

**Build mode** — you are building or modifying a demo page (e.g. via `cdl-build`). Read the catalog below and apply every rule while writing the code. No report needed; just don't commit the mistakes.

**Review mode** — the user invoked this skill with a page path (e.g. `/cdl-design-standards src/pages/my-page.tsx`). Read that file and check it against every rule in the catalog. Report each violation as: rule number, the offending line(s) (`file:line`), and the concrete fix. If the user asks you to fix them, apply the fixes. If invoked with no path, ask which page(s) to review, or review the pages changed on the current branch if that's unambiguous.

## Where this skill sits

This skill answers one question: **how to build a page with CDL components.** What a demo must *contain* is `cdl-demo-conventions`. A suite's exceptions are its client overlay. The four layers and the order they win in are stated once, in `cdl-demo` — this file is layer 2.

`cdl-demo-audit` mode 2 calls this skill's review mode on each page and folds the findings into its report. When the page lives under `/demo/<client>/`, load that client's overlay together with this file.

## Rule format

Each rule has three parts — keep this format when adding rules:

- **Mistake** — the pattern the LLM tends to produce, and why it's wrong.
- **Correct pattern** — what to do instead, including the decision test for borderline cases.
- **Example** — a minimal wrong-vs-right code pair.

---

## Rules

### Rule 1 — Don't default to `description` on `CdlBlockHeader`; most explanatory text belongs in the `info` tooltip

**Mistake:** Filling the `description` prop on every (or nearly every) `CdlBlockHeader` on a page. `description` renders an always-visible second line under the title and grows the header, so a page full of them reads as noisy and repetitive — especially when the copy just restates the title ("Overview of monthly billing" under a "Monthly Billing" header).

**Correct pattern:** Default to no supporting text at all. When a block genuinely needs explanation (how to read a chart's series, what a table's filter criteria are), put it in the `info` prop — it renders as a hover tooltip behind an info icon and costs no vertical space. Reserve `description` for the rare case where the reader cannot interpret the block without reading the text first.

Decision test, in order:
1. Does the copy merely restate the title? → delete it entirely.
2. Is it helpful detail, but the block is understandable without it? → `info`.
3. Must the reader see it before the block makes sense at all? → `description` (rare; a few per page at most, not one per block).

**Example:**

```tsx
// ❌ Wrong — description restates the title on every block
<CdlBlockHeader
  title="Lounge Visits by Month"
  description="Monthly lounge visit volumes across all locations"
/>

// ✅ Right — helpful detail moves to the hover tooltip
<CdlBlockHeader
  title="Lounge Visits by Month"
  info="Bars show completed visits; the line overlays the 3-month rolling average."
/>

// ✅ Also right — no supporting text when the title is self-explanatory
<CdlBlockHeader title="Lounge Visits by Month" />
```

> Do not move deleted copy into a loose paragraph beside the block. Rule 10 states where prose may live.

---

### Rule 2 — Prefer tables for data; never stack tables just to fit more on one page

**Mistake:** Two opposite errors.

1. Presenting record-shaped data as card grids, definition lists, or custom layouts when a table fits better.
2. Stacking table after table down one page because everything was assigned to that page, not because the tables belong together. The page becomes a scroll of unrelated grids, and the reader cannot tell which one answers their question.

**Correct pattern:** Default to `CdlDataTable` for anything record-shaped.

Stacking tables is allowed, and often correct. Stack them when they form one reading: the same subject at different grain, or steps the reader takes in order down the page. Two or three related tables in sequence are easier to follow than the same tables hidden behind a tab bar.

When tables stack for no reason other than page assignment, ask what the reader is doing, then pick the remedy that fits:

| The tables are… | Remedy |
|---|---|
| Alternate views of one subject, read one at a time | `CdlTabs` — one tab per table |
| The same subject at different grain, read in order | Leave them stacked, in one section, in reading order |
| Different subjects that share the page's job | Separate sections with their own `CdlContentHeading` |
| Different jobs for different readers | Separate routes |

Do not force unrelated tables into a tab bar. Tabs hide content, so a tab bar of unrelated labels turns into a drawer the client never opens, and it also fails Rule 7's structure. Splitting the page is the honest fix, and page count is not a constraint — see "Pages are not a budget" below.

When you do use tabs, remember the demo-routing rule in CLAUDE.md: the active tab is view-shaped state, so encode it in the URL, not `useState`.

**Telling "alternate views" from "one subject at different grain".** The first two rows of that table are the ones that get confused, and picking wrong is what puts a tab bar over content that should be stacked. The discriminator is whether the reader needs one section to trust another:

- **Steps of one process that produce and check a single figure** — the number, the basis it was built from, the exceptions it left behind — are one subject at different grain. A reader checking the number wants the basis on the same screen. **Stack them.** An accrual, the segment basis it was built from, and its GL validation belong on one page as three blocks in reading order.
- **Mutually exclusive slices of one dataset** — Open / Disputed / Settled, one rate structure out of five — are alternate views. A reader works one slice at a time and never compares two. **Tabs.**

Test: would the reader open a second section to trust the first? If yes, stack.

Decision test, for a page with three or more tables:
1. Would a reader ever compare two of them side by side? → keep them stacked and adjacent.
2. Do they answer one question at different grain? → stacked, in one section.
3. Do they answer separate questions for one reader? → sections, or tabs if only one is needed at a time.
4. Do they serve different readers or different decisions? → separate routes.

**Example:**

```tsx
// ❌ Wrong — unrelated tables stacked to fill one page
<CdlBlockGroup>…invoice lines…</CdlBlockGroup>
<CdlBlockGroup>…feed health…</CdlBlockGroup>
<CdlBlockGroup>…user permissions…</CdlBlockGroup>

// ❌ Also wrong — the same unrelated tables forced into one tab bar
<CdlTabs items={[
  { label: "Invoices", content: <InvoiceTable /> },
  { label: "Feeds", content: <FeedTable /> },
  { label: "Permissions", content: <PermissionTable /> },
]} />

// ✅ Right — alternate views of one subject, active tab driven by the route
// (CdlTabs keys tabs by label; activeTab/onTabChange is the controlled mode)
<CdlTabs
  activeTab={labelForSlug(view)}
  onTabChange={(label) => navigate(`/demo/foo/${slugFor(label)}`)}
  items={[
    { label: "Open", content: <InvoiceTable status="open" /> },
    { label: "Disputed", content: <InvoiceTable status="disputed" /> },
    { label: "Settled", content: <InvoiceTable status="settled" /> },
  ]}
/>

// ✅ Also right — one subject at two grains, stacked in reading order
<CdlBlockGroup>…totals by month…</CdlBlockGroup>
<CdlBlockGroup>…the lines behind the selected month…</CdlBlockGroup>
```

#### 2a — Pages are not a budget

**Mistake:** Treating the page list you were given — from a brief, a ticket, or the routes that already exist — as a fixed number, then compressing everything into it. The symptoms are the ones above, plus stacked tab bars, KPI rows that mix subjects, and one table made to mean several things.

**Correct pattern:** Add the route the experience needs. A demo's job is to get people on board, not to ship a final product, so a client who cannot follow the flow is a failed demo — no matter how complete the content is. Two clear pages always beat one crowded page. Every demo route is defined in one routes file, so a new page costs one route entry.

Adding a page is structure, and structure is yours to decide. Adding a business function is scope, and scope is the client's to decide. When a demo starts from a brief, `cdl-demo-audit` records the new routes as deviations before the build starts.

---

### Rule 3 — Don't overload KPI cards

**Mistake:** Cramming a `CdlKpiCard` with everything the props allow at once — value, change, progress bar, icon, a `children` breakdown list, and a footer link — or packing several metrics into one card. The card stops reading as a glanceable number.

**Correct pattern:** One metric per card: `header` + `value`, plus at most one supporting element (`change` + `changePeriod`, **or** `progress`, **or** a short `children` breakdown — not several). If a metric seems to need more, that detail belongs in a chart or table block next to the KPI row, or behind the card's `href` drill-down. Keep all cards in a KPI row at the same density.

**Example:**

```tsx
// ❌ Wrong — one card doing four jobs
<CdlKpiCard header="Billed Visits" value="12,480" change={8.2}
  changePeriod="vs last month" progress={74} icon={Plane}>
  <BreakdownList items={byLounge} />
</CdlKpiCard>

// ✅ Right — the card states one number; detail lives elsewhere
<CdlKpiCard header="Billed Visits" value="12,480" change={8.2} changePeriod="vs last month" />
```

#### 3a — No explanatory sentence under the value

**Mistake:** Writing a muted line of prose beneath the value to explain what the number is, where it routes, or how to read it ("each routes to its accrual line", "day 3 of the 5-day close"). A KPI row is scanned, not read. Eight cards each carrying a sentence produce visual fatigue, and the eye stops finding the numbers.

**Correct pattern:** The card carries the `header`, the value, and — when the number needs a destination — the `href` + `linkText` footer link. Nothing else. Explanation that a reader genuinely needs goes in the page or block header, where it is written once instead of once per card. A drill path is already stated by the link text, so never describe it in prose as well.

**Example:**

```tsx
// ❌ Wrong — a sentence explains the number and repeats the drill path
<CdlKpiCard header="Outstanding exceptions" href="/exceptions" linkText="Work the list">
  <p className="text-xl font-medium">4 open</p>
  <p className="text-sm text-muted-foreground">each routes to its accrual line</p>
</CdlKpiCard>

// ✅ Right — one figure, one link
<CdlKpiCard header="Outstanding exceptions" value="4 open"
  href="/exceptions" linkText="Work the list" />
```

> The sentence does not belong above the KPI row either. Rule 10 states where prose may live.

#### 3b — A value and its comparator are two cards, not one

**Mistake:** Putting a figure in the value slot and its budget, target, prior period, or variance in a subtext line under it ("$597,000" over "-$53K against a $650,000 budget"). This is the same overload as above, and it also buries two real metrics where neither can be scanned or compared across the row.

**Correct pattern:** Give each figure its own card, in reading order: the actual, the comparator, then the difference. Size the grid so the cards fill even rows (8 cards across 4 columns, not 7 across 5). Use the `change` + `changePeriod` props only for a period-over-period **percentage** — that is the one comparator the card renders as a first-class element rather than as prose.

**Example:**

```tsx
// ❌ Wrong — three figures crammed into one card as a sentence
<CdlKpiCard header="Strike residual">
  <p className="text-xl font-medium">$597,000</p>
  <p className="text-sm text-muted-foreground">-$53K against a $650,000 budget</p>
</CdlKpiCard>

// ✅ Right — each figure is its own KPI
<CdlKpiCard header="Strike residual" value="$597,000" />
<CdlKpiCard header="Strike budget" value="$650,000" />
<CdlKpiCard header="Strike variance">
  <p className="text-xl font-medium tabular-nums text-emerald-600">-$53K</p>
</CdlKpiCard>
```

> **Baseline gotcha:** at the default density the card reserves `min-h-[110px]` and spreads its contents, so a card with no footer link drops its value to the card floor while its linked neighbours hold the value up under the header. Pass `className="justify-start gap-2"` to the link-less cards to put every value in the row on one baseline.

---

### Rule 4 — Don't stack content inside table cells; split it into columns

**Mistake:** Rendering two or three stacked lines inside one cell (e.g. name over email over ID, or a value with a muted sub-label beneath it). Stacked cells make rows tall, break vertical alignment, and hide data from sorting and filtering.

**Correct pattern:** One piece of data per cell. If a cell is carrying a second line, that second line is almost always its own column — and as a column it becomes sortable and filterable. If the extra content is longform, apply Rule 6 (drawer) instead. Users can hide low-priority columns via the table configurator; that's the affordance for density, not stacking.

**Example:**

```tsx
// ❌ Wrong — two data points stacked in one cell
{ header: "Member", cell: (row) => (
    <div>
      <div>{row.name}</div>
      <div className="text-muted-foreground text-xs">{row.email}</div>
    </div>
  ) }

// ✅ Right — each data point is its own column
{ header: "Member", accessorKey: "name" },
{ header: "Email", accessorKey: "email" },
```

#### 4a — A column header's qualifier goes in brackets on the same line, never stacked under the label

**Mistake:** Stacking a second line under a column header to qualify it — `Actual` under `Jul-26`, `7 months` under `Closed`, a unit under a metric name. The header block then grows to two lines on every column, which raises the whole header row, and a grid of twelve month columns turns into a wall of small type. It is Rule 4's mistake moved from the cell to the header.

**Correct pattern:** Put the qualifier in brackets after the label, on one line, in `text-muted-foreground` so the label still reads first. A one- or two-letter marker is enough once the block header states the key — `Jul-26 (A)`, `Aug-26 (F)`, `Closed (7 mo)`.

Two refinements matter:

- **Mark only where the grid mixes states.** A grid whose every column is a forecast repeats `(F)` twelve times and says nothing; drop the marker there and let the block header state that the whole grid is a forecast. The marker earns its place at the boundary.
- **Spell the letters out once, in the block or page `info`** (Rule 10). A bracketed letter is a legend entry, not an explanation.

**Example:**

```tsx
// ❌ Wrong — a second line under every month, on every column
header: () => (
  <span className="flex flex-col items-end gap-0.5">
    <span>{m.short}</span>
    <span className="text-[10px] uppercase text-muted-foreground">
      {isActual ? "Actual" : "Forecast"}
    </span>
  </span>
)

// ✅ Right — one line, the qualifier in brackets, muted
header: () => (
  <span className="block whitespace-nowrap text-right">
    {`${m.short} `}
    {mixed && <span className="text-muted-foreground">{isActual ? "(A)" : "(F)"}</span>}
  </span>
)
```

Mark the month columns — `(A)` for a closed actual, the version type's initial for a projected month — and drop the marker entirely when the view carries no closed months. The same shape holds across a full plan year.

---

#### 4b — Two stackings that pass for one value: a status with a detail line, and several labels in one cell

**Mistake:** Treating these as a single value because they sit together in the data. A status label over a muted line of explanation, a case reference or a follow-up action is two values. A cell that shows several flags side by side is a list, not a value.

**Correct pattern:**

- **A status with a detail line under it.** The cell keeps the short label; the detail goes in the row's drawer (Rule 6), or on a tooltip where the table has no drawer.
- **Several labels in one cell.** Where a row can carry more than one flag, the cell states the count (`2 flags`) with the flags on its tooltip, and the drawer lists each one with its detail.

---

### Rule 5 — Don't scatter colored badges for status; reserve color for urgency

**Mistake:** Rendering every status-like field as a colored badge, so a table becomes a wall of competing colors and nothing stands out. Color loses its meaning when routine states ("Active", "Synced", "Standard") shout as loudly as problems.

**Correct pattern:** Routine status renders quietly — plain text or a muted indicator, not a saturated badge per row. Color is reserved for what needs attention, and when something is genuinely urgent, highlight the **whole row (or column)** rather than one small badge, so urgent and surface-level information are clearly separated.

> **Component gap:** the intended component for this is `StatusSource` (status + where the value came from). It does not exist in CDL yet. Until it does, treat it as a missing-component flag under `cdl-build` Step 3 and use quiet text/indicator styling; do not fall back to a colored badge per row.

**Example:**

```tsx
// ❌ Wrong — every row gets a colored badge; urgent and routine look the same
{ header: "Status", cell: (row) => <Badge variant="destructive">{row.status}</Badge> }

// ✅ Right — routine status is quiet text; urgent rows are highlighted whole
{ header: "Status", accessorKey: "status" }
// …and flag urgency at the row level, e.g. a row className/highlight for rows
// that need attention — not a louder badge.
```

---

### Rule 6 — Longform copy never lives in a table column; the row opens a drawer

**Mistake:** Giving notes, descriptions, or comments their own table column. Longform text either truncates into uselessness or blows up the row height and wrecks the table's scannability.

**Correct pattern:** Keep the table to short, scannable fields. Clicking the row (via `CdlDataTable`'s `onRowClick`) opens a `CdlDrawer` that shows the row's meta information plus the full longform copy. Per the demo-routing rule in CLAUDE.md, the open drawer is view-shaped state — drive it from a route param (`/demo/…/rows/:rowId`) so a deep link lands on it.

**Example:**

```tsx
// ❌ Wrong — a "Notes" column holding paragraphs
{ header: "Notes", accessorKey: "notes" }

// ✅ Right — the row opens a drawer with meta + longform copy
<CdlDataTable data={rows} columns={columns}
  onRowClick={(row) => navigate(`/demo/foo/rows/${row.id}`)} />
<CdlDrawer open={!!selectedRow} onOpenChange={(o) => !o && navigate("/demo/foo")}
  header={<RowMeta row={selectedRow} />}>
  <p>{selectedRow?.notes}</p>
</CdlDrawer>
```

> The drawer takes the copy the table could not hold. It does not take everything else as well — see Rule 12.

---

### Rule 7 — Tabs above a table belong inside the `CdlBlockGroup`, below the block header

**Mistake:** Making `CdlTabs` the outer wrapper, with a `CdlBlockGroup` (or a whole panel) inside each tab's `content`. The tab bar then floats on the page background above the panel border, disconnected from the block it controls — and the block header ends up duplicating the tab label.

**Correct pattern:** One `CdlBlockGroup` owns the whole assembly. Reading order inside it: block header, then the tab bar, then the table. `CdlTabs` supports this directly — pass the `CdlBlockHeader` via the tabs' `header` prop (it pins above the bar), use shared-children mode (items carry only `label`/`badge`, no `content`), and render the active table conditionally inside one `CdlBlockContent`. Align the bar with the block via `barClassName="px-0"` and `contentClassName="p-0 gap-0"`. Swap the header's `title`/`info` with the active tab.

**Example:**

```tsx
// ❌ Wrong — tabs wrap the block; the bar floats outside the panel
<CdlTabs items={[
  { label: "Feeds", content: <CdlBlockGroup>…table…</CdlBlockGroup> },
  { label: "Exceptions", content: <CdlBlockGroup>…table…</CdlBlockGroup> },
]} />

// ✅ Right — the block wraps the tabs; header, then bar, then table
<CdlBlockGroup>
  <CdlTabs
    items={[{ label: "Feeds", badge: "2" }, { label: "Exceptions", badge: "4" }]}
    activeTab={tab}
    onTabChange={(label) => navigate(hrefFor(label))}
    header={<CdlBlockHeader title={titleFor(tab)} info={infoFor(tab)} />}
    barClassName="px-0"
    contentClassName="p-0 gap-0"
  >
    <CdlBlockContent>
      {tab === "Feeds" ? <FeedsTable /> : <ExceptionsTable />}
    </CdlBlockContent>
  </CdlTabs>
</CdlBlockGroup>
```

---

### Rule 8 — Match text to its author: system-generated text follows a fixed template, never freeform prose

**Mistake:** Writing every string in the demo data as conversational natural language — alert messages, log lines, exception reasons, audit entries, and notifications all phrased as full, varied sentences. Real systems emit templated strings, not prose. When rows of the same type each get a differently-phrased sentence, the data reads as fake and the eye can't scan a column for the part that differs.

**Correct pattern:** Before writing any string, decide who authored it in the fiction of the demo:

1. **System-generated** (alerts, log lines, exception reasons, audit trails, notifications, validation messages) → one fixed, terse template per output type, applied identically to every instance of that type: same field order, same separators, same casing, same units. Only the values vary between rows, never the sentence structure.
2. **Human-authored** (a user's note, a comment, a chat message, an annotation) → natural language is correct, and tone/length may vary the way real people vary.
3. **Prose by product design** (e.g. an AI-generated summary the product genuinely renders as prose) → natural language is fine, but keep the register consistent across instances.

Decision test: would this string come out of a template/`printf` in a real backend? Then it must look templated, and every row of its type must share the exact same shape. The template can still be human-readable — "Missing records: 3 (upstream SFTP-04)" — as long as it is rigidly consistent.

**Example:**

```tsx
// ❌ Wrong — system outputs phrased as varied prose sentences
const exceptions = [
  { reason: "The reconciliation failed because 3 records were missing from the upstream file." },
  { reason: "We couldn't match invoice INV-2214 — the amounts differ by $120.50." },
]

// ✅ Right — one template per output type; only the values vary
const exceptions = [
  { reason: "Missing records: 3 (upstream SFTP-04)" },
  { reason: "Amount mismatch: INV-2214 (Δ $120.50)" },
]

// ✅ Also right — a human-authored note stays natural language
const notes = [
  { author: "D. Chen", note: "Confirmed with the lounge partner — resend after the 15th." },
]
```

---

### Rule 9 — Font weight stops at `font-medium`; `font-semibold` requires an explicit user request

**Mistake:** Reaching for `font-semibold` (or `font-bold`) whenever something should stand out — headings, KPI values, table headers, emphasized cells. Heavy weights scattered across a page flatten the hierarchy: when everything is bold, nothing is, and the page drifts away from CDL's quiet default look.

**Correct pattern:** Two weights only: `font-normal` (the default — don't write it out unless overriding an inherited weight) and `font-medium` for emphasis. That one step is enough contrast for titles, labels, and highlighted values. `font-semibold` is reserved for specific cases the user has explicitly asked for — never introduce it on your own judgment; `font-bold` is effectively never used. If `font-medium` doesn't feel like enough emphasis, adjust size or color token instead of escalating weight.

Decision test:
1. Body/default text → no weight class (inherits `font-normal`).
2. Needs emphasis → `font-medium`.
3. Tempted by `font-semibold` → only if the user explicitly asked for it on this element; otherwise stay at `font-medium`.

**Why a "semibold" request may not look semibold.** A theme's font may ship no 600 face. The Novartis theme uses FK Grotesk, which is loaded at Thin, Light, Regular, Medium, Bold and Black, so `font-semibold` there resolves to the Bold face and reads heavier than intended. When a request for semibold is honoured under such a theme, check which weights the theme's `@font-face` rules declare before assuming the rendered result is 600.

**Example:**

```tsx
// ❌ Wrong — semibold introduced for generic emphasis
<span className="font-semibold">{row.total}</span>

// ✅ Right — medium is the emphasis ceiling
<span className="font-medium">{row.total}</span>

// ✅ Right — semibold only where the user explicitly requested it
<h2 className="font-semibold">…</h2> // user: "make this page title semibold"
```

---

### Rule 10 — The page explains itself through structure; prose is the exception and has a fixed set of homes

**Mistake:** Adding explanatory commentary wherever there is room for it — an intro paragraph under the page title, a "how to read this" note above a chart, muted helper text between two blocks, a footnote under a table, a caption that restates what the axis labels already say. Rules 1 and 3a each block one instance of this (`description` on a block header, a sentence under a KPI value), so the commentary moves to a loose `<p className="text-sm text-muted-foreground">` instead, which no component slot governs. The root cause is the same in every case: narrating the design to the reader rather than letting the interface state its own meaning. A demo carrying this text reads as a document about a product, not as the product.

**Correct pattern:** A page communicates through structure, labels, units, and grouping. Titles name things, columns and axes carry their own units, and order carries priority. Prose is a fallback for what those cannot express, and it lives only in a component slot built for it:

| Home | Use |
|---|---|
| `CdlBlockHeader` `info` | Detail about one block (how to read a series, a table's filter criteria). |
| `CdlPageHeader` `titleInfo` | Detail about the whole page. Note that `CdlPageHeader` has **no** `description` prop — the tooltip is the only slot by design. |
| `CdlBlockHeader` `description` | Rare, per Rule 1 step 3. |
| `CdlContentHeading` `subheading` | A label for a sub-section, not a sentence about it. Apply the Rule 1 test to it. |
| `CdlEmptyState` `description` | Why the state is empty and what to do next. |

Keep every `info` string to one or two sentences. A tooltip that grows into a paragraph is the same mistake relocated. Never place a bare paragraph, `<p>`, or muted `<div>` of copy directly in a page's layout — if the text has no slot, CDL withheld the slot on purpose.

Decision test, for any sentence you are about to write on a page:
1. Do a title, a column header, a unit, or a badge already say it? → delete it.
2. Does it explain your design choice ("this view groups by fleet so you can compare") rather than the data? → delete it.
3. Is it real detail the reader needs? → the matching `info` slot, in one or two sentences.
4. Does it have no slot? → it does not belong on the page.

**Example:**

```tsx
// ❌ Wrong — a paragraph narrates the page, a note narrates the chart
<CdlPageHeader title="Fleet Utilization" />
<p className="text-sm text-muted-foreground">
  This page brings together utilization across all three fleets so you can compare
  them side by side. Use the tabs below to switch between periods.
</p>
<CdlBlockGroup>
  <CdlBlockHeader title="Hours by Aircraft Type" />
  <p className="text-xs text-muted-foreground">Note: read the bars left to right.</p>
  <UtilizationChart />
</CdlBlockGroup>

// ✅ Right — the structure carries the meaning; real detail sits in a tooltip
<CdlPageHeader title="Fleet Utilization" titleInfo="Excludes aircraft in heavy check." />
<CdlBlockGroup>
  <CdlBlockHeader
    title="Hours by Aircraft Type"
    info="Bars show block hours; the dashed line is the fleet plan."
  />
  <UtilizationChart />
</CdlBlockGroup>
```

---

### Rule 11 — A KPI row reads as one sentence, and every comparator has its difference

**Mistake:** Filling a KPI row card by card, each figure chosen on its own. The row then holds a budget with no variance beside it, or a variance parked at the far end from the two figures it comes from. Rules 3, 3a, and 3b govern one card; this rule governs the row.

**Correct pattern:** Order the row so it reads left to right as a single claim: the figure, the basis it is judged against, then the difference between them. Apply four checks before the row ships.

- **No orphan comparator.** A card holding a baseline figure — budget, prior period, prior version, last year — is followed by the difference against it. A row that shows the comparator and leaves the reader to subtract two cards has spent a slot and answered nothing.
- **No orphan difference.** A difference card sits with the figures it comes from. Name its baseline in the header — `Actual vs Budget`, never `Variance`.
- **A comparator earns a card only when nothing else states it.** When the baseline figure is already a column in the table below, drop that card and give the slot to the difference, which the table does not state. A duplicated column buys nothing.
- **The basis set holds across the controls.** A period, entity, or scenario control must not silently change which bases the row shows. When a basis does not exist for the selected window — no closed actual on a forward period — substitute another basis in the same slot and keep the card count identical.

**Why it matters:** A KPI row is scanned in about two seconds. A comparator with no difference turns that scan into mental arithmetic across a row, which the reader will not do. They read the two largest numbers and draw the wrong conclusion.

**Also required — the row matches what the list screen promised.** When a register, queue, or index table scores each record on a set of differences, the detail page for a record opens with that same set in its KPI row. A register that ranks records on three deltas beside a detail page that shows two leaves the reader to hunt for the third. Keep the unit the same across both screens: if the register states deltas in dollars, the row states dollars, and any percentage lives in the table.

**Example:**

```tsx
// ❌ Wrong — a budget card with no variance, and the grid leaves an orphan
<CdlKpiCard header="Actual cost" value="$4.12M" />
<CdlKpiCard header="Budget" value="$4.40M" />
<CdlKpiCard header="Open exceptions" value="0" />

// ✅ Right — figure, basis, difference, in reading order
<CdlKpiCard header="Actual cost" value="$4.12M" />
<CdlKpiCard header="Budget FY26" value="$4.40M" />
<CdlKpiCard header="Actual vs Budget">
  <p className="text-xl font-medium tabular-nums text-emerald-600">-$280K</p>
</CdlKpiCard>
```

> **Grid gotcha:** keep the row even — six cards across three or six columns, eight across four. When the checks above produce an odd count, cut the weakest comparator figure. Do not pad the row with a metric the page does not otherwise use.

---

### Rule 12 — Don't overload the drawer; a drawer is not a solution to a layout problem

**Mistake:** Treating `CdlDrawer` as the place where leftover content goes. The row's full record, a meta grid, a timeline, an audit trail, a second table, a chart, and three action rows all land in one panel, and the body scrolls for several screens. The drawer became the answer to "where does this go?" — which is a page-structure question, not a drawer question.

The component invites this, so watch for it. The body is a `ScrollArea`, so nothing pushes back as content grows. And the panel is narrow: `width` offers only `sm` (384px), `md` (480px, the default), and `lg` (576px). Content that needs more room than `lg` does not belong in a drawer at all.

**Correct pattern:** A drawer holds one record and answers one question about it. Keep the pinned parts pinned: identity in `header`, and the commit actions in `footer`, which sits below the scroll rather than inside it.

When a drawer genuinely carries several kinds of content about one record, group them with `CdlTabs` directly under the drawer header — the same component Rule 2 and Rule 7 use. Reach for tabs when the reader needs one kind at a time (Details, Activity, Attachments). Keep the tab in the URL, next to the route param that opens the drawer, per the demo-routing rule in `CLAUDE.md`.

Decision test, in order:
1. Does the content restate what the table row already shows? → delete it. The drawer adds what the row could not hold.
2. Is it one kind of content, under about two screens of scroll? → plain drawer body, no tabs.
3. Several kinds, and the reader needs one at a time? → `CdlTabs` inside the drawer, two to four tabs.
4. More than four tabs, a table inside a tab, or content wider than `lg`? → this is a page, not a drawer. Give it a route (see Rule 2a).

**Example:**

```tsx
// ❌ Wrong — every kind of content stacked in one scrolling panel
<CdlDrawer open={open} onOpenChange={setOpen} header={<RowMeta row={row} />}>
  <MetaGrid row={row} />
  <FullNotes row={row} />
  <ActivityTimeline row={row} />
  <RelatedInvoicesTable row={row} />
  <ApprovalActions row={row} />
</CdlDrawer>

// ✅ Right — one record, grouped by kind, actions pinned in the footer
<CdlDrawer
  open={!!row}
  onOpenChange={(o) => !o && navigate("/demo/foo")}
  header={<RowMeta row={row} />}
  width="lg"
  footer={<ApprovalActions row={row} />}
  flushBody                       // the tab bar spans the panel; the panels carry the inset
>
  <CdlTabs
    items={[{ label: "Details" }, { label: "Activity", badge: "3" }]}
    activeTab={tab}
    onTabChange={(label) => navigate(`/demo/foo/rows/${row.id}/${slugFor(label)}`)}
    barClassName="px-3"
    contentClassName="p-3"
  >
    {tab === "Details" ? <MetaGrid row={row} /> : <ActivityTimeline row={row} />}
  </CdlTabs>
</CdlDrawer>

// ✅ Also right — the related-invoices table was never drawer content
// It lives on the record's own route: /demo/foo/rows/:rowId
```

---

### Rule 13 — Page-level tabs go on `CdlPageContainer`; block-level tabs go inside the block

**Mistake:** Reaching for `CdlTabs` inside a `CdlBlockGroup` when the tabs switch the whole page body, not one table inside one block. The bar then sits below a KPI row or a banner, so the reader sees a page-level control wearing a block-level costume — and every tab has to re-declare its own block chrome.

**Correct pattern:** Decide what the bar switches, then pick the level.

| The tabs switch… | Where the bar goes |
|---|---|
| One table (or chart) inside one block, header and toolbar shared | `CdlTabs` inside the `CdlBlockGroup` — Rule 7 |
| The whole page body: a different block, or a different set of blocks | `CdlPageContainer`'s `navLinks` + `activeTab` + `onTabChange` |

Page-level tabs render directly under the page header, above everything in `children`. Each tab then owns its own `CdlBlockGroup`, with its own title, `info`, and header `actions`. Give a tab a `badge` when it carries a count the reader must act on (open exceptions, blockers, anomalies).

Anything that describes the whole page — a KPI row, a period control, a status banner, an export button — stays outside the per-tab blocks. Put page-wide controls in `actions` on the page header. Put a page-wide KPI row at the top of `children`, where it repeats above every tab, because it states the subject the tabs divide.

Per the demo-routing rule in CLAUDE.md, the active tab is view-shaped state. Encode it in the URL — a path segment where one is free, or a search param where the path segment is already taken by a drill-down id.

**Example:**

```tsx
// ❌ Wrong — a page-level bar buried in a block, below the KPI row
<CdlPageContainer title="Rate Calculation">
  <KpiRow />
  <CdlBlockGroup>
    <CdlTabs items={[{ label: "Aircraft inputs" }, { label: "Fleet averages" }]} …>
      <CdlBlockContent>{…}</CdlBlockContent>
    </CdlTabs>
  </CdlBlockGroup>
</CdlPageContainer>

// ✅ Right — the bar belongs to the page; each tab owns its own block
<CdlPageContainer
  title="Rate Calculation"
  actions={<ViewToggle />}
  navLinks={[
    { label: "Aircraft inputs" },
    { label: "Fleet averages" },
    { label: "Anomalies", badge: openCount > 0 ? String(openCount) : undefined },
  ]}
  activeTab={tabLabel}
  onTabChange={(label) => setParam("tab", slugFor(label))}
>
  <KpiRow />
  {tab === "inputs" && <CdlBlockGroup>…</CdlBlockGroup>}
  {tab === "averages" && <CdlBlockGroup>…</CdlBlockGroup>}
  {tab === "anomalies" && <CdlBlockGroup>…</CdlBlockGroup>}
</CdlPageContainer>
```

---

### Rule 14 — An expandable table scrolls the page, not itself

**Mistake:** Setting `overflow="hidden"` on `CdlPageContainer` and giving the table's block `flex-1 min-h-0` plus `scrollable`, on a page whose table expands into sub-rows. The table is then bounded to whatever is left of the viewport after the KPI row and the chart above it — often a few hundred pixels. Expanding every row is the point of a drill-down table, and the reader gets a short inner scroll box instead of the full picture. Two nested scrollbars appear, and the outer one does nothing.

**Correct pattern:** Decide by what the block holds, not by how the page looks when it first loads.

| The block's table… | Page `overflow` | The table's block |
|---|---|---|
| Expands into sub-rows (`getSubRows`), or has no fixed row count | `"auto"` (the default — omit the prop) | `shrink-0`, `noFill`, no `scrollable` |
| Is a fixed, bounded list that must stay above the fold with a pinned toolbar | `"hidden"` | `flex-1 min-h-0` + `scrollable` |

`overflow` already defaults to `"auto"`, so the correct case is usually the one where you write nothing. Only reach for `"hidden"` when a bounded inner scroll is the point — a register or a worklist the reader works top to bottom while a KPI band stays visible.

When the expanded height is large, say so in a comment beside the table: the row count tells the next reader why the page scrolls. See `docs/cdldatatable.md` for the vertical-scroll architecture and the `hideFillerRow` / `h-full` relationship.

A drill-down level that yields exactly one child row is not a level. If the grouping key has a single value for the current selection — one year, one region, one vendor — hang the next level's rows directly off the parent instead of rendering a child that restates the parent's own figure.

**Example:**

```tsx
// ❌ Wrong — an expandable table boxed into the leftover viewport
<CdlPageContainer title="Outlook variance" overflow="hidden">
  <ChartBlock />
  <CdlBlockGroup className="flex-1 min-h-0">
    <CdlBlockContent className="min-h-0">
      <CdlDataTable data={rows} columns={cols} scrollable noFill getSubRows={(r) => r.children} />
    </CdlBlockContent>
  </CdlBlockGroup>
</CdlPageContainer>

// ✅ Right — the page scrolls, the table renders its full expanded height
<CdlPageContainer title="Outlook variance">
  <ChartBlock />
  <CdlBlockGroup className="shrink-0">
    <CdlBlockContent>
      {/* Fully expanded this runs to 78 rows. */}
      <CdlDataTable data={rows} columns={cols} noFill getSubRows={(r) => r.children} />
    </CdlBlockContent>
  </CdlBlockGroup>
</CdlPageContainer>
```

---

### Rule 15 — An alert-styled state belongs in a table row; a page carries no banner, no alert badge, and no alert label in a detail list

**Mistake:** Reaching for a page-level alert surface whenever a page holds a condition worth flagging. Four shapes recur, and all four are the same mistake:

1. A `CdlBanner` above the content, stating a problem, a dependency, or a standing risk.
2. An alert-coloured `titleBadge` beside the page title.
3. An alert-toned status label inside a `CdlDetailPanel`, a drawer's field list, or a label/value row under a KPI band.
4. A coloured callout box wrapping a figure the page already states.

Each one puts a warning where the reader cannot act on it. A banner pushes the figures below the fold, an alert badge competes with the page title, and an amber label in a detail list flags a fact about one record that the record's own row already carries. The page then reads as a warning about a system rather than as the system.

**Correct pattern:** A state that needs attention is a property of a **record**, so it renders in that record's table row — a quiet status cell, and `rowClassName` washing the whole row when it is genuinely urgent (Rule 5). Everything else states the condition without alarm:

| The condition is… | Where it goes |
|---|---|
| A record needing attention | That record's row: a status cell, plus a row wash if urgent |
| A count of such records | A KPI card with its own `href` to the queue (Rule 3) |
| A standing fact about the whole page — a dependency, a resourcing risk, an unresolved owner | The `titleInfo` tooltip, or a plain label/value row stating it as text |
| A state a detail list reports — posted, received, locked, awaiting | Plain text in that row. A detail list reports; it does not warn |

A neutral badge naming a **state** is not an alert and stays: `Read-only`, `Locked`, `Aug 2026 Outlook · WD4`. The test is colour and intent — a badge that says what the screen *is* belongs; a badge that says something is *wrong* does not.

Decision test, in order:
1. Does the condition belong to one record? → its table row, and a count card if the reader needs the total.
2. Is it a fact about the page that the reader cannot act on here? → `titleInfo`, or a plain detail row. Never coloured.
3. Is it a neutral state label — read-only, locked, the active period? → a plain `Badge`, uncoloured.
4. Still tempted by a banner? → the condition has no record behind it, which means it is prose. Rule 10 applies.

**Example:**

```tsx
// ❌ Wrong — a banner, and an alert badge, for conditions the tables already carry
<CdlBanner severity="warning" title="3 of 12 countries do not reconcile"
  action={{ label: "Open the status", href: "/demo/foo/analysis" }} />
<CdlPageContainer titleBadge={<Badge className="text-amber-600"><Warning />1 FTE, no backup</Badge>} />

// ❌ Also wrong — an alert label in a detail list
<PsDetailRow label="Posting status">
  <StatusLabel tone="warn" label="Not posted" />
</PsDetailRow>

// ✅ Right — the count links to the queue; the standing fact is a tooltip
<CdlPageContainer
  title="Overview"
  titleInfo="One FTE runs all five components, and the designated backup is named while its holder is not."
>
  <CountCard header="Countries with no mapping" value={3} tone="warn"
    href="/demo/foo/analysis" linkText="Open the tracked status" />
</CdlPageContainer>

// ✅ Right — a detail list reports, and the row itself carries the flag
<PsDetailRow label="Posting status">Not posted</PsDetailRow>
// …and in the register's table:
{ header: "Status", cell: ({ row }) => <StatusLabel tone={tone(row)} label={row.original.status} /> }
```

**Convergence:** remove a banner the next time you modify a page that still carries one, and rehome what it said per the table above. Do not add a new one, and do not rewrite an untouched page only to converge it.

---

### Rule 16 — A table of percentages carries a control that switches it to the underlying amount

**Mistake:** Rendering a share, mix, or percent-of-parent table with percentages only, because that is how the source spreadsheet prints it. A share answers "where does this concentrate" and nothing else. The reader cannot tell whether 0.00% is an empty line or a funded one rounded away, and cannot size any row against the rest of the business. The same mistake in reverse is an amounts-only table where the question is concentration.

**Correct pattern:** Give the block a unit control and derive one reading from the other. Store the amounts as the data and compute the share at render time, so the two views can never disagree and the columns tie. Put the control in the block header's `actions` slot, not in a tab bar — the unit is a reading of the same subject, and tabs are for switching subjects (Rule 7). Keep it in a URL search param so a shared link opens on the reading the sender was looking at. Default to the unit the source prints, and say in the block `info` what the other unit adds.

Two decimals of share cannot round-trip through whole units, so do not claim a rounded percentage column sums to exactly 100% — state that the amounts tie and the shares round.

**Borderline case:** A single percentage column beside its own amount column needs no control — both readings are already on screen. The control earns its place when the percentages occupy a grid of period columns, where adding a second column per period would double the table's width.

**When the two readings are two bases, the control needs a third position: their difference.** A share and its amount are one number read two ways, so a two-position control loses nothing. Two *bases* — an actual against a model, a close against a plan, a system against a system — are two numbers that are meant to agree, and the reader's whole job is to find where they do not. A source that prints both blocks side by side does that on the page; a control that shows one at a time takes it away, and the reader flips back and forth holding numbers in memory. Add a difference position and the control does the subtraction the eye was doing. Name each option by what it is — `P&L (GL actual)`, `Model (allocation model)`, `Variance (Model less P&L)` — so the comparator is stated rather than implied (`cdl-demo-conventions` Convention 5). On a difference reading, colour by size and not by sign: the two bases carry no favourable direction, so a cell colours once it misses by more than a stated threshold, and the row washes when the line needs attention (Rule 5).

Implement it as a `BASIS_OPTIONS` list, a `basis` search param, and a `cellClass` helper that colours by size rather than by sign.

**Example:**

```tsx
// ❌ Wrong — percentages only, and the share is the stored data
const columns = MONTHS.map((m, i) => ({ id: m, cell: ({ row }) => fmtPct(row.original.shares[i]) }))

// ✅ Right — amounts are stored, the unit is a control, the share is derived
const unit = params.get("unit") === "amount" ? "amount" : "share"
const columns = MONTHS.map((m, i) => ({
  id: m,
  cell: ({ row }) =>
    unit === "amount"
      ? fmtCompact(row.original.months[i])
      : fmtPct(psShare(row.original.months[i], monthTotals[i])),
}))

<CdlBlockHeader title="Point of sale GB" info={…} actions={<UnitSelect value={unit} />} />
```


---

### Rule 17 — On an inline-editable table, the row click belongs to the cell editor, not to a drawer

**Mistake:** Giving an editable table both affordances at once — `meta: { editable: true }` on the value columns *and* an `onRowClick` that routes to a drawer. The row then has two click targets competing for the same gesture. A reader aiming at a rate cell opens a panel instead, and a reader who wanted the panel has to hunt for a cell the editor does not claim. Rule 6 put the drawer there, so the pattern looks correct until someone tries to edit.

**Correct pattern:** Pick one. A table whose cells are editable belongs to the editor: no `onRowClick`, no drawer. Stage the edits and commit them from a `CdlActionBar` (`onPendingEditsChange` + `clearEditsOn` + a Save action), and say so once in the block header's `description` — "Click an In force cell to edit the rate in place."

Everything the drawer used to carry has to go somewhere else:

| The drawer held… | Where it goes on an editable table |
|---|---|
| A short field the table could not fit | Its own column, hidden by default via `meta: { defaultHidden: true }` |
| A per-row commit (approve, confirm, resolve) | The block header's `actions`, naming the record it acts on |
| A record's history or its prior values | The change log (`cdl-demo-conventions` Convention 17), where a row opens a `CdlDialog`, not a drawer |
| Longform derivation prose about one row | Nowhere. Family-level explanation moves to the block `info`; per-row prose has no home, per Rule 10 |

Rule 6 still holds for a **read-only** table: there the row click is free, and a drawer is the right home for longform. This rule is the exception Rule 6 does not state, and it wins wherever a column is editable.

A dialog opened from a row is not the same thing. A change-log row is read-only, so its row click is free, and Terminal Handling opens a `CdlDialog` from it.

**Example:**

```tsx
// ❌ Wrong — the editor and the drawer fight over the same row
<CdlDataTable
  data={rates}
  columns={rateColumns}          // meta: { editable: true } on the rate column
  onPendingEditsChange={onEdits}
  onRowClick={(r) => navigate(hrefFor("rates", r.id))}   // opens a drawer
/>
<RateDrawer row={selected} … />

// ✅ Right — the row belongs to the editor, and the commit sits in the header
<CdlBlockHeader
  title="Aircraft rates"
  info={…}
  description="Click an In force cell to edit the rate in place."
/>
<CdlDataTable
  data={rates}
  columns={rateColumns}
  onPendingEditsChange={(_c, changes) => setEdits(changes)}
  clearEditsOn={clearEditsOn}
/>
<CdlActionBar open={edits.length > 0} count={edits.length}
  countLabel="Unsaved rate edits"
  actions={[{ label: "Save changes", icon: FloppyDisk, onClick: save }]}
  onDeselect={discard} />
```

The finished shape: several views, most of them editable, no drawer anywhere on the page, and the change log's card opening as a dialog.

**Convergence:** an editable page written before this rule tends to carry both affordances. Drop the `onRowClick` and rehome its content per the table above the next time you modify one. Do not add a new one, and do not rewrite an untouched page only to converge it.

**Gotcha:** the inline editor writes to `rowOriginal[columnId]`, so the editable column needs a real field on the row. A value held inside an array — a month of a twelve-month series — has to be flattened onto the row first (`{ ...row, rate: row.months[monthIndex] }`), and the save writes it back into the array. Bump `clearEditsOn` whenever the selector behind that flattening moves, or a staged edit lands on the wrong period.

---

### Rule 18 — A tab bar for whole views belongs on `CdlPageContainer`, not inside a block

**Mistake:** Putting the page's primary tab bar inside the content block — a `CdlTabs` wrapping a `CdlBlockGroup`, with the block header passed as the tabs' `header`. The bar then sits below the page title in a bordered card, one indent in from everything else, and it reads as a control over that card rather than as the page's own navigation. It also constrains itself to the card's width, so a long bar starts scrolling while the page still has room.

**Correct pattern:** When each tab is a whole view of its own — a different table, a different key, a different record type — the bar goes on `CdlPageContainer` via `navLinks` / `activeTab` / `onTabChange`. The container renders it directly under the page header, full width, and the block below holds one `CdlBlockHeader` (the view's name and `info`) over one `CdlBlockContent`.

```tsx
// ✅ Right — the page owns the bar, the block owns one view
<CdlPageContainer
  title="Master data"
  navLinks={VIEWS.map((v) => ({ label: LABELS[v], badge: badges[v] }))}
  activeTab={LABELS[view]}
  onTabChange={(label) => navigate(hrefFor(viewForLabel(label)))}
>
  <CdlBlockGroup className="shrink-0">
    <CdlBlockHeader title={LABELS[view]} info={INFO[view]} actions={…} />
    <CdlBlockContent>{table}</CdlBlockContent>
  </CdlBlockGroup>
</CdlPageContainer>
```

**Borderline case:** A `CdlTabs` *inside* a block is right when the tabs are cuts of one dataset that the block header describes as a whole — a queue split into Review queue / Auto-routed / Audit trail over the same invoices, or a card's Comments / Details panes. The test: if switching tabs changes what the block header should say, the bar belongs on the page.

**Gotcha:** page-level `navLinks` makes the content region fill and scroll. A `sticky bottom-6 mt-auto` action bar still works inside it, but a child that assumed the page scrolled as one column may need `shrink-0`. `navVariant` picks the bar's shape — `"gated"` for a close's ordered steps, the default plain strip for peer views.

The finished shape: many peer tables on one page, the tab bar on the container, one block header per view.

**Convergence:** lift the bar onto the container the next time you modify a page that still keeps it inside the block. Do not rewrite an untouched page only to converge it.

---

### Rule 19 — A measure over time is one grid: periods across, entities down

**Mistake:** Two shapes, both of which break a dated measure into pieces the reader has to reassemble.

1. **Periods as rows.** One row per month, or one row per entity *per* month with a `Month` column beside the entity columns. The same entity then appears twelve times, no row states what the entity did over the year, and the reader cannot compare two entities in one glance.
2. **History and projection as two tables.** A trailing-actuals table stacked above a forecast table, because the actuals and the forecast came from different calculations. They are the same measure at the same grain, so the split is an artifact of how the number was produced, not of how it is read. The reader loses the one thing they came for: where the actuals stop and the projection takes over.

**Correct pattern:** One `CdlDataTable`. Periods are the columns, in calendar order, running through the actuals and straight on into the forecast. Entities are the rows, as the additive tree `cdl-demo-conventions` Convention 14 describes — the total, its parts, and the records behind each part, opened in place with `getSubRows`.

Four things make the grid work:

- **Every column header states its basis** in brackets, per Rule 4a — `(A)` for a closed actual, `(F)` for a forecast, and one more letter where the view has a third state (an actual a normalisation excluded, an adjusted month). Spell the letters out once in the block `info`; never stack the word under the month.
- **Subtotal columns come before the months, not after.** A grid of twelve or twenty period columns scrolls sideways, so a total parked at the right end is off screen at the moment the reader is deciding which row to open. Put one subtotal per basis — the actuals, the forecast — directly after the row label, and never sum two bases into one column.
- **Pin the label column** (`pinFirstColumn` with `scrollable` and `fixedLayout`), so a row keeps its name while the months scroll.
- **A cell with nothing in it is blank, not zero.** An invoice raised in March has no February; a forecast month has no invoices at all. `$0` claims a measurement that was never taken — leave the cell empty, and use an em-dash only in a subtotal column where the row genuinely contributed nothing.

**Decision test:** would the reader ever compare the same entity across two periods? Then the periods are columns. Rows stay periods only when each row is a *record about* a period — a close register, a cycle list, a run log — rather than a measure sliced by it.

**Example:**

```tsx
// ❌ Wrong — the entity repeats once per month, and the series is unreadable
{ accessorKey: "supplier", header: "Supplier" },
{ accessorKey: "month", header: "Month" },
{ accessorKey: "amount", header: "Amount" },

// ❌ Also wrong — the same measure split across two blocks
<CdlBlockGroup>…trailing actuals by month…</CdlBlockGroup>
<CdlBlockGroup>…projected months…</CdlBlockGroup>

// ✅ Right — one grid, basis marked per column, subtotals before the months
const columns = [
  { accessorKey: "label", header: "Supplier / invoice", size: 240 },
  { accessorKey: "inRate", header: () => <span className="block text-right">In the rate</span> },
  { accessorKey: "forecast", header: () => <span className="block text-right">Forecast</span> },
  ...gridMonths.map((gm) => ({
    id: gm.id,
    header: () => (
      <span className="block whitespace-nowrap text-right">
        {gm.short}
        {mixedBasis && <span className="font-normal text-muted-foreground">{` (${BASIS_MARK[gm.basis]})`}</span>}
      </span>
    ),
    accessorFn: (row) => row.cells[gm.id],
    cell: ({ getValue }) => <span className="block text-right tabular-nums">{getValue() === undefined ? "" : fmtCompact(getValue())}</span>,
  })),
]

<CdlDataTable
  data={[totalRow]} columns={columns}
  hideToolbar pinFirstColumn scrollable noFill fixedLayout
  getSubRows={(row) => row.subRows} getRowId={(row) => row.id}
  defaultExpanded={{ total: true }} resetExpansionOn={expansionKey}
/>
```

The finished shape: actuals, excluded actuals and forecast months in one grid, marked `(A)` / `(X)` / `(F)`, with supplier and invoice rows beneath — and the same grid carried across a full plan year.

**Convergence:** pivot a page that still carries a `Month` column beside its entity columns the next time it is modified. A page whose rows are close cycles is not a deviation — that is the exception the decision test names. Do not rewrite an untouched page only to converge it.

---

### Rule 20 — A key column that repeats one value on every row is a level of a tree, not a column

**Mistake:** Building a roll-up table the way the source spreadsheet prints it — one flat row per combination, with the grouping keys repeated as columns down the whole grid. A cost-centre column stating the same cost centre 70 times, an entity column with one value, a region column that changes every fourteenth row. The repeated cells buy nothing: they cost horizontal width the period columns need, and the reader has to read the same string on every line to find the one place it changes. It is Rule 4's mistake at the table level — data that is structure, rendered as content.

**Correct pattern:** Make the repeating keys the levels of a `getSubRows` tree, in the order the source prints them, and give the table one label column plus a column naming the level. Every level is the exact sum of its children, so a subtotal ties out and the reader can stop at whatever depth answers the question. Expand by default down to the grain the work is done at, with the finer levels one click below it — pass `defaultExpanded` a record keyed by the ids of the levels above that grain, not `true`.

Decision test, per key column:
1. Does it hold one value across the whole table? → a level. It is the table's subject, not a field of a row.
2. Does it hold a handful of values, each covering many rows? → a level.
3. Does it change on nearly every row, or is it a fact about the leaf? → a column.

A level with exactly one child restates its parent, which Rule 14 already forbids as a *drill-down step*; as the **root** of a stated hierarchy it is allowed, because the reader has to see which cost centre or entity the grid is about. The test is whether the reader learns something the level above did not say.

**Example:**

```tsx
// ❌ Wrong — three key columns repeating two values across 70 rows
const columns = [
  { accessorKey: "costCentre", header: "Cost center" },   // one value, 70 times
  { accessorKey: "profitCentre", header: "Profit center" }, // one value, 70 times
  { accessorKey: "fleet", header: "Fleet type" },
  ...monthCols,
]

// ✅ Right — the keys are the tree, and one column names the level
<CdlDataTable
  data={tree}
  columns={[labelCol, levelCol, ...monthCols, totalCol]}
  getRowId={(n) => n.id}
  getSubRows={(n) => n.children}
  defaultExpanded={{ "fs-cc": true, "fs-pc": true }}  // opens on the fleet grain
  fixedLayout
  pinFirstColumn
/>
```

The finished shape: a finance summary whose tree runs cost centre → profit centre → fleet type → contract → vendor, and an account grid that nests the same way across a plan year.

> When the tree's value cells are editable, Rule 17 applies on top: the row click belongs to the cell editor, and an edit made on a roll-up row spreads to its leaves so every level still ties out.

---

### Rule 21 — A table displays; row-level actions live in the row's ellipsis menu, and a commit that needs the record's detail lives in its drawer

**Mistake:** Adding an action column to a read-only table — a `Reconcile`, `Approve`, `Confirm` or `Resolve` button rendered per row, usually last, with `e.stopPropagation()` in its handler so it does not also fire the row click. It looks efficient: the reader works down the list without opening anything. It costs the table its job. The column has no heading, carries no value to read or sort, and repeats one control down every row that qualifies; the reader's eye now scans a ragged column of buttons instead of the figures beside them. Worse, the commit fires with no detail on screen — the reader presses a button against a row they have not read.

**Correct pattern:** The table states the facts, and the row click opens the drawer. Put the commit in the drawer's `footer`, where the record's own detail is on screen to justify it: the status and what it means, the figures, the tolerance, and the sentence that says what the action will do. Gate the button on the same condition the column used, so a row with nothing to commit opens a drawer with no footer.

Every other action on one row — open, preview, download, upload a new version, duplicate, copy a link, publish, delete — goes in the row's ellipsis menu: `CdlDataTable`'s `rowActions` slot, rendering a `DotsThreeVertical` `DropdownMenu` trigger. The table gets one narrow, pinned column with one quiet control per row, instead of a ragged column of buttons, and the reader finds every row-level action in the same place on every table. Order the items by use, and put a destructive item last, after a `DropdownMenuSeparator`, with `variant="destructive"`. Stop the click on both the trigger and the `DropdownMenuContent`: the menu renders in a portal, and React bubbles its events up to the row's `onRowClick`.

A bulk commit across many rows is the exception, and it does not go in a column either — it goes in the block header's `actions` or the page's, naming the count it acts on ("Close all 3 ready events").

| Wanted | Where it goes |
|---|---|
| Any row-level action — open, preview, download, upload, duplicate, publish, delete | The row's ellipsis menu (`rowActions`) |
| A commit on one record that the reader must justify from its detail — approve, reconcile, resolve | The drawer's `footer` |
| A commit across many | `CdlBlockHeader` `actions`, or the page's `actions`, with the count in the label |
| A value the reader edits in place | An inline cell editor, which makes the table Rule 17's, not this one's |

**Example:**

```tsx
// ❌ Wrong — the last column commits
const columns = [
  …,
  {
    id: "reconcile",
    header: "",
    cell: ({ row }) => (
      <Button size="sm" onClick={(e) => { e.stopPropagation(); reconcile(row.original) }}>
        Reconcile
      </Button>
    ),
  },
]

// ✅ Right — row-level actions sit in the row's ellipsis menu
<CdlDataTable
  data={rows}
  columns={columns}
  onRowClick={(row) => navigate(hrefFor(row.id))}
  rowActions={(row) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Actions for ${row.name}`} onClick={(e) => e.stopPropagation()}>
          <DotsThreeVertical size={16} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      {/* the menu is portalled; stop its clicks reaching onRowClick */}
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => download(row)}>Download</DropdownMenuItem>
        <DropdownMenuItem onClick={() => upload(row)}>Upload new version</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => remove(row)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )}
/>

// ✅ Also right — a commit judged on the record's detail: the row opens, and the drawer commits
<CdlDataTable data={lines} columns={columns} onRowClick={(row) => navigate(hrefFor(row.id))} />

<CdlDrawer
  open={openLine !== null}
  footer={
    openLine && canWrite && openLine.status === "Above tolerance" ? (
      <Button size="sm" onClick={() => reconcile(openLine)}>Reconcile — rebalance the accrual</Button>
    ) : undefined
  }
>
  {/* the figures, the tolerance, and what the action will do */}
</CdlDrawer>
```

**Convergence:** a table that renders per-row action buttons, or keeps row-level actions somewhere other than the ellipsis menu, moves them into `rowActions` the next time the page is modified. Do not rewrite an untouched page only to converge it.

**Boundary with Rule 17:** an inline cell editor is not an action column. A table whose cells edit a value belongs to the editor, and Rule 17 governs it — including where that table's per-row commit goes. This rule covers the read-only table, where Rule 6 already sends the row to a drawer: the commit follows it there.

---

### Rule 22 — A selection screen carries labels and controls, not prose

**Mistake:** Building the screen that gates a step — pick a version, pick a scenario, then run — as a page of explanation. An intro paragraph above the controls, a help paragraph under every label, a note under every control, a sentence beside the commit button. Each line is true, and together they bury the two dropdowns the screen exists for. The same mistake produces choice cards instead of dropdowns: a card carries a title, a figure and a description, so three options become a wall of copy where a closed dropdown would be one line.

The screen also strands its content at the top of an empty block, because a short form in a `flex-1` block leaves the rest of the step blank.

**Correct pattern:** One label per control, one commit button, nothing else. The explanation goes in the block header's `info` tooltip, which is where Rule 1 already puts it. Use a `Select` per choice, not a grid of cards; put the figure that decides the choice in the option row itself (`Gantt v4 · 24-Aug-26 · 20 events`), so the reader compares options in the open list rather than in body copy. Centre the form in the block (`flex items-center justify-center` on `CdlBlockContent`) and cap its width, so the step reads as a form and not as an unfinished page.

State what is in force once the step renders: put the committed selection in the block header's action row, beside the control that reopens the selection. It is one short muted line — the reader has to know which cut is on screen, and a tooltip is the wrong place for a fact that changes.

Carry the selection in the URL, not in local state, so a link reproduces the cut (`cdl-demo-conventions` Convention 3). Local state holds a half-made selection; the URL is written once, when the user commits.

**Example:**

```tsx
// ❌ Wrong — the screen explains itself three times over
<CdlBlockContent>
  <p>The calendarization runs on one published Gantt version, against one base…</p>
  <h3>1 · Gantt version</h3>
  <p>Maintenance Planning republishes the schedule as the plan moves…</p>
  <div className="grid sm:grid-cols-3">{versions.map((v) => <ChoiceCard … />)}</div>
  …
  <Button>Calendarize 20 events</Button>
  <span>The grid opens on this selection, and the link carries it.</span>
</CdlBlockContent>

// ✅ Right — labels, controls, commit; the prose is in the header tooltip
<CdlBlockHeader title={title} info="The step runs on one published Gantt version and one base scenario…" />
<CdlBlockContent className="flex min-h-0 items-center justify-center overflow-y-auto">
  <div className="flex w-full max-w-sm flex-col gap-5 py-6">
    {field("Gantt version", versionId, versionOptions, setVersionId)}
    {field("Base scenario", scenarioId, scenarioOptions, setScenarioId)}
    <Button size="sm" className="w-fit" disabled={!ready} onClick={() => commit(versionId, scenarioId)}>
      Calendarize {plural(count, "event")}
    </Button>
  </div>
</CdlBlockContent>

// …and once it renders, the header states what is in force
<CdlBlockHeader
  title={title}
  info={info}
  actions={
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-xs text-muted-foreground">{`${version.label} · ${scenario.label}`}</span>
      <Button variant="outline" size="sm" onClick={clearSelection}>Change selection</Button>
    </div>
  }
/>
```

**Boundary with Rule 1:** Rule 1 governs a header's own `description` and `info`. This rule governs the body of a selection screen: the body holds no explanatory copy at all, so every sentence a builder wants to write moves into that `info`.

### Rule 23 — A parameter panel's output moves with the parameters; the commit records, it never reveals

**Mistake:** Gating the output of a parameter set behind a `Run` button. The reader opens the parameters, changes the driver, presses Apply, and the screen answers with a toast saying to run the scenario: the cards read `—`, the projected columns are absent, and nothing states what the new driver produced. The build usually does this on purpose — dropping the run whenever a parameter moves is what stops a stale projection sitting under fresh parameters. The intent is right and the result is wrong, because comparing two parameter sets is the whole point of a parameter panel, and a reader who must re-run between them cannot compare anything.

The same mistake reads as a second symptom: the screen offers two ways to set one figure — the panel that builds it, and a plain input on another view that types it in. The two disagree the moment either is used.

**Correct pattern:** Derive every output from the parameters, so applying a set moves the cards, the columns and the header's own description in one render. Nothing is hidden and nothing needs a press to appear. The commit then does the one thing the display cannot: it **records** the built figure where the rest of the demo reads it. Name the button for that act and for its target (`Record for Budget 2027`, not `Run scenario`), disable it while the recorded figure already equals the built one, and label it `Recorded` in that state. State the two figures side by side in the block header's `description` — what the build produces, and what the consumer still carries — so the reader can see whether pressing the button would change anything.

Where a figure has a builder, the builder is its only writer. Any other view states the figure, marks whether it is recorded or carried forward, and carries a button to the builder. Two writers on one number is how two screens come to disagree.

**Example:**

```tsx
// ❌ Wrong — the output only appears after a run, so no two parameter sets can be compared
const ran = searchParams.get("ran") === "1"
const rows = ran ? tnmForecast(months, rate, driver, escalation, adjustment, anchor) : []
<CdlKpiCard header="Projected">{ran ? fmtCompact(total) : "—"}</CdlKpiCard>
<Button onClick={run} disabled={ran}>{ran ? "Scenario run" : "Run scenario"}</Button>
// …and applying a parameter drops the run
toast.success("Parameters applied — run the scenario to project on them")

// ✅ Right — the output is derived, and the button records it
const rows = tnmForecast(months, rate, driver, escalation, adjustment, anchor)
const built = annualize(rows)
const carried = tnmRunRate(cycle)
const recorded = Math.abs(built - carried) < TOLERANCE
<CdlKpiCard header="Projected">{fmtCompact(total)}</CdlKpiCard>
<CdlBlockHeader
  title={title}
  description={
    recorded
      ? `Maintenance T&M carries ${fmtCompact(carried)} a year for ${cycle.label} — the figure this build produced.`
      : `This build annualizes to ${fmtCompact(built)} a year. Maintenance T&M still carries ${fmtCompact(carried)}: record the build to move the account.`
  }
  actions={
    <Button size="sm" onClick={record} disabled={!canWrite || recorded}>
      {recorded ? "Recorded" : `Record for ${cycle.label}`}
    </Button>
  }
/>
```

**Boundary with `cdl-demo-conventions` Convention 12:** that convention says a judgment call is entered rather than calculated, and entered with its reason. This rule says where that entry lives: in the parameter panel that builds the figure, once, not in a second input on a view that also displays it.

---

---

### Rule 24 — A coded option list is a searchable combobox, and the detail the reader recognizes goes in the hint

**Mistake:** Reaching for `Select` for every picker, whatever it holds. It is right for a short list of words the reader reads and picks — three bases, four statuses. It is wrong for a list of **codes**: check IDs, work orders, GL accounts, part numbers, cost centres. The reader does not know the code. They know the thing behind it — the aircraft, the vendor, the station — so a closed list of codes makes them scroll and read every row to find the one they already identified by another name. In a table cell the list is worse, because the panel is as narrow as the column.

**Correct pattern:** Use `CdlCombobox`, which adds a search field, and put the identifying detail in each option's `hint`. Search matches the label, the value **and** the hint, so the reader types what they know. Four things make it work:

- **The label stays the code.** It is what the trigger shows and what a cell has room for. The hint is the qualifier, and the component truncates the label before the hint — so keep the hint short and widen `contentClassName` past the trigger when it needs the room.
- **Name the fields the search covers** in `searchPlaceholder` — `Check ID, FIN, fleet or MRO…`, not `Search…`. A search field that silently covers more than the label is a feature nobody finds.
- **Size the trigger to its context.** The trigger is `h-9` by default; in a table row pass `h-8` so it matches the selects beside it.
- **Align the panel `end`** when it is wider than its column, so it grows inwards rather than off the edge of the table.

Decision test:
1. A short list of words the reader reads and picks? → `Select`.
2. A list of codes, or more than about ten options? → `CdlCombobox`.
3. Does the reader identify an option by something other than its label? → that something is the `hint`.

**Example:**

```tsx
// ❌ Wrong — a closed list of codes the reader cannot search
<Select value={value} onValueChange={commit}>
  <SelectTrigger size="sm"><SelectValue placeholder="Not coded" /></SelectTrigger>
  <SelectContent>
    {events.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
  </SelectContent>
</Select>

// ✅ Right — searchable, and the hint is what the reader types
<CdlCombobox
  options={events.map((e) => ({ value: e, label: e, hint: HINTS[e] }))}  // "FIN 733 · A330-300 · Avianor Inc"
  value={value || undefined}
  onChange={(v) => v && commit(v)}
  placeholder="Not coded"
  searchPlaceholder="Check ID, FIN, fleet or MRO…"
  className="h-8"
  align="end"
  contentClassName="w-[440px]"
/>
```

**Gotcha:** on a table whose rows also click through, wrap the control in `<div onClick={(e) => e.stopPropagation()}>`. Radix's `Select` swallows the click; the combobox trigger is a plain `<button>` and does not, so without the wrapper opening the picker also fires the row.

**Convergence:** swap a cell-level `Select` over coded options the next time you modify the page that holds it. Do not rewrite an untouched page only to converge it.

---

### Rule 25 — A drill-down that replaces a page's content owns the page header, not a button inside the block

**Mistake:** Building a drill-down as a swap inside the page body — the tab's table is replaced by the record's own view — and leaving the header exactly as it was. The page title still names the register, the breadcrumb still ends at the register, the tab bar still offers the sibling tabs, and the only way back is a `Back to…` button added to the block header's `actions`. The reader is inside one record and every piece of page chrome says they are still in the list. The back control also competes with the view's real controls for the one action row the block has.

**Correct pattern:** When a route replaces the page's content with one record, the header moves with it. `CdlPageContainer` has the props for all of it:

| The header part | On the register | On the drill-down |
|---|---|---|
| `title` | what the register holds | the record's own name |
| `titleInfo` | what the register is for | this record: its window, its source, who loaded it |
| `segments` | the section | the section, plus a crumb back to the register |
| `onBack` / `backLabel` | absent | the return to the register, labelled with where it goes |
| `navLinks` / `activeTab` | the sibling views | **absent** — there is nothing to switch between inside one record |

Then delete the block's own back button. The block header keeps only the controls that read the record — a grain, a basis, a unit.

Decision test:
1. Does the route render a different subject than the tab bar's own views? → it is a drill-down; move the header.
2. Does it render the same subject differently — a unit, a grain? → it is a reading of that view; the header stays and the control goes in the block header (Rule 16).

**Example:**

```tsx
// ❌ Wrong — the header still describes the register, and the block carries the way back
<CdlPageContainer title="Master data" segments={sectionCrumb} navLinks={TABS} activeTab={label}>
  {record ? <RecordView rate={record} onBack={goBack} /> : <RegisterTable />}
</CdlPageContainer>
// …and inside RecordView:
<CdlBlockHeader actions={<Button onClick={onBack}>All FX rates</Button>} />

// ✅ Right — the header names the record, walks back to the register, and drops the tabs
<CdlPageContainer
  title={record ? record.scope : "Master data"}
  titleInfo={record ? describe(record) : REGISTER_INFO}
  segments={record ? [...sectionCrumb, { label: "Master data", onClick: goBack }] : sectionCrumb}
  onBack={record ? goBack : undefined}
  backLabel="Back to the FX rates register"
  navLinks={record ? undefined : TABS}
  activeTab={record ? undefined : label}
>
  {record ? <RecordView rate={record} /> : <RegisterTable />}
</CdlPageContainer>
```

The crumb returns to the **tab the reader came from**, not to the section's default tab, so the trip back is where they left.

**Boundary with `cdl-demo-conventions` Convention 25:** that convention says a page scoped to one instance carries no instance picker and that its back link and breadcrumb return to the register. This rule is the same claim read from the component's side — which props carry it, and that the tab bar comes off.

**Convergence:** a drill-down whose back control sits in the block header moves it to `onBack` the next time that page is modified. Do not rewrite an untouched page only to converge it.

### Rule 26 — A dialog or drawer header carries identity only

**Mistake:** Using the header as a summary line. The title gets a subtitle under it, then the status joins it, then the account, the owner and the type — and the panel restates half the table row before the reader reaches any content.

```tsx
header={
  <span className="flex flex-col gap-0.5">
    <span className="flex items-center gap-2">
      <span className="text-base font-medium">{row.id}</span>
      <Badge>{row.status}</Badge>
    </span>
    <span className="text-xs text-muted-foreground">
      {row.account} · {row.owner} · {row.type}
    </span>
  </span>
}
```

**Correct pattern:** The header answers "which record is this?" and stops. Everything else is content.

```tsx
header={<span className="tabular-nums">{row.id}</span>}
```

Three reasons it matters, beyond the clutter:

- **It is the accessible name.** `CdlDrawer` renders `header` inside the dialog's title, and `CdlDialogHeader` does the same with `title`. A screen reader announces the whole pile as the panel's name, so "INV-40218 Needs attention Northwind Wholesale Standard terms" becomes what the panel is called.
- **It never scrolls.** Header height is charged to every tab and every scroll position, including the ones the facts have nothing to do with.
- **It competes with the title.** A subtitle at `text-xs text-muted-foreground` directly under the title reads as part of it, so neither lands.

**A subtitle is a summary line even when it holds two facts.** The test is kind, not count. A name over `Work · 34 days waiting` is a category and a duration — both are properties of the record, and the content region below already states properties as labelled fields, where they can be read, aligned and scanned against each other. The header keeps the name.

**The two components differ on purpose.** `CdlDialogHeader` types `title` as a plain `string`, so a dialog cannot grow a subtitle at all. `CdlDrawer` types `header` as `React.ReactNode`, because a drawer header legitimately carries one small adornment beside the name — a copy affordance, a state chip. Treat the looser type as permission for one adornment, not for a second line.

Where the displaced facts go, in order:

1. Does the table row behind the panel already show it? → delete it. The panel adds what the row could not hold (Rule 12).
2. Does it explain one tab's content? → put it in that tab, next to what it explains.
3. Do all the tabs need it? → one strip at the top of the shared content region, below the tab bar, not above it.

The same applies to the footer: commit actions, and no explanatory prose alongside them.

---

### Rule 27 — A label names the thing, not the container the thing sits in

Applies to every string that names something: a button, a block or section heading, a tab, a KPI card header, a column header, a dialog title.

**Mistake:** Labelling with an abstract stand-in for the object — "Approve the computed figure", "Export selected items", "Save changes" on a control; "The queue", "Results", "Details", "Overview of the data" on a heading. The label names a container or a category the object belongs to instead of the object, so the reader has to look elsewhere to learn what the figure is, what changed, or what is in the list. It is worst on a primary button and a block header, because both are read before anything around them.

**Correct pattern:** Name what is actually there: the value, the count, the rows' own noun — whatever is concrete and already known when the thing renders.

| Kind | Instead of | Write |
|---|---|---|
| Button | "Approve the computed figure" | "Approve 18,228 units" |
| Button | "Export selected items" | "Export 4 invoices" |
| Block header | "The queue, worst value first" | "Overdue invoices this cycle" |
| Block header | "The decision on this line" | "Units to carry across" |
| Tab | "Details" | "Breakdown by warehouse" |

Where there is genuinely nothing concrete to name, let the verb or the noun stand alone rather than padding it with an abstraction: `Adjust` beats `Adjust the value`.

**Two things this is not.** First, it is not a licence to restate the sort or the filter in the title — "worst value first" is design commentary the column header already carries, and Rule 10 deletes it. Fixing an abstract label means naming the contents, not appending an explanation.

Second, a word is not abstract merely because it sounds generic. If the domain uses it as the name of the thing — `Modules` in a product that has modules, `Overview` where it is the name of a view — it is the name, and it stays. The test is not how the word sounds.

Decision test: read the label with the rest of the screen covered. If it still says what will happen or what is underneath, it is right. If it needs its surroundings to mean anything, the object belongs in the label.

These words are the tell, and each is a placeholder where a noun should be: **figure, value, item, record, entry, data, information, selection, changes, details, queue, list, results**. Finding one is reason to go looking for the concrete thing it stands in for — not reason to rewrite it on sight.

**Example:**

```tsx
// ❌ Wrong — a container word, and the sort restated from the column header
<CdlBlockHeader title="The queue, worst value first" />
<Button onClick={approve}>Approve the computed figure</Button>

// ✅ Right — each label carries its own object
<CdlBlockHeader title="Overdue invoices this cycle" />
<Button onClick={approve}>Approve {units.toLocaleString()} units</Button>

// ✅ Right — nothing concrete to name, so the verb stands alone
<Button variant="outline" onClick={openEditor}>Adjust</Button>
```

---

### Rule 28 — The brief is input, not content

Rules 28 to 30 are not tied to one component. They catch the habit of leaving the scaffolding of the brief — its explanations, its caveats, its narration — visible in the product. A real application assumes its user knows their own job and shows them their work; it does not introduce itself.

**Mistake:** Carrying language from the brief onto the screen. An intro block describing what the section is for, an "About this view" card, a purpose statement under the page title, a panel restating the process the page supports, a summary of why these metrics were chosen. The brief explains the build to whoever commissioned it; that audience is not the user sitting in the application. A real product never explains its own existence to a user who opened it on purpose.

**Correct pattern:** The brief determines what gets built — which pages, which columns, which actions — and then disappears. A user arriving at the page sees their data and their controls. If a fact from the brief is genuinely operational (a filter's criteria, a figure's exclusions), it goes in the matching `info` tooltip per Rule 10; if it only justifies the design, it is dropped.

Decision test, for any block of copy on a page:

1. Would this text exist if the product had shipped two years ago and the user opened it for the hundredth time? → if no, delete it.
2. Is it describing the *page* rather than the *data*? → delete it.
3. Is it operational detail? → Rule 10's slots, one or two sentences.

**Example:**

```tsx
// ❌ Wrong — the brief's framing rendered as UI
<CdlBlockGroup>
  <CdlBlockHeader title="About this workspace" />
  <CdlBlockContent inset>
    <p className="text-sm text-muted-foreground">
      Supplier recovery consolidates disputed charges so the team can track
      recovery from claim through to credit. This page replaces the
      spreadsheet process described in the discovery sessions.
    </p>
  </CdlBlockContent>
</CdlBlockGroup>

// ✅ Right — the page opens on the work
<CdlBlockGroup>
  <CdlBlockHeader title="Open claims" info="Claims raised in the last 18 months." />
  <CdlBlockContent><ClaimsTable /></CdlBlockContent>
</CdlBlockGroup>
```

---

### Rule 29 — No build scaffolding on screen

**Mistake:** Leaving traces of the build process in the interface — a "Demo" or "Prototype" banner, "Sample data" notices, "Coming in phase 2" placeholders, annotations pointing out features, a legend explaining what to look at, TODO copy, or a disclaimer about the data being illustrative. Each one tells the viewer they are looking at a mockup, which is the one thing the build exists to avoid.

**Correct pattern:** Every element on screen is one the shipped product would carry. A capability that isn't built is not represented at all — no greyed tile, no "coming soon" card, no disabled nav item. Caveats about the data belong in the conversation or the README, never in the UI. Where a state genuinely has nothing to show, use `CdlEmptyState` with the copy a real product would use ("No open claims") rather than an explanation of the build's scope.

**Example:**

```tsx
// ❌ Wrong — the build talks about itself
<CdlBanner variant="info">Demo data — figures are illustrative only.</CdlBanner>
<Card className="opacity-50">Forecast accuracy — coming in phase 2</Card>

// ✅ Right — only what ships is on screen
<ClaimsTable />
```

---

### Rule 30 — Every control on screen does something

**Mistake:** Rendering affordances for completeness — filters that don't filter, an export button that does nothing, a tab that shows the same content, a search box wired to nothing, a status dropdown that never changes the rows. They read as real to the eye, so the first click is the thing that breaks the illusion.

**Correct pattern:** A control either works against the seeded data or it isn't rendered. Fewer working controls beat a full toolbar of decoration. When a control is genuinely out of scope, remove it rather than disabling it — a disabled control still makes a claim about the product (Rule 29).

Decision test: click it. If nothing observable changes, delete it or wire it.

**Example:**

```tsx
// ❌ Wrong — a toolbar of decoration
<div className="flex gap-2">
  <Input placeholder="Search claims…" />              {/* not wired */}
  <StatusSelect options={statuses} />                  {/* filters nothing */}
  <Button variant="outline">Export</Button>            {/* no handler */}
</div>

// ✅ Right — one control, and it works
<StatusSelect value={status} onValueChange={setStatus} options={statuses} />
```

---

### Rule 31 — Pad each edge once

**Mistake:** Every layer adding its own padding, so the space between content and its edge is the sum of three or four values nobody chose together. The usual stack: a CDL container that already pads, a layout `div` with `p-4` inside it, then a component that pads itself. The same happens with gaps: a `mt-2` on a child whose parent already sets `gap-4`, or a `min-h-*` that reserves height the content does not need. The result reads as loose and unfinished, it costs vertical space that tables need, and a panel or rail meant to meet a border ends up floating off it.

These CDL containers already pad or space their children, so check them before adding any padding inside:

| Container | What it applies |
|---|---|
| `CdlPageContainer` content | `p-4` and `gap-4`. Override with `contentClassName`. |
| `CdlTabs` content, with `fill` | `p-3` and `gap-4`. Without `fill`, `pt-4` and `gap-4`. Override with `contentClassName`. |
| `CdlBlockGroup` / `CdlBlockHeader` | The header pads itself. The content region has no padding by default. |

**Correct pattern:** Every edge has one owner. Before writing a padding, margin or gap class, name the edge it separates the content from, and look up the tree for an ancestor that already separates it.

- An ancestor already pads that edge: add nothing.
- The child has to own the edge, because it pads itself or has to meet the border (a rail, a table, an embedded record body): zero the ancestor with `contentClassName="p-0 gap-0"`. Do not stack a second value on top.
- Space between siblings belongs to the parent's `gap`, never to margins on the children.
- A minimum height (`min-h-*`) goes only where content of a known height must line up, never as a reserve.

Test: measure from the content to the edge of its container. The distance should be one step of the spacing scale, such as 12px or 16px, and never a sum like 28px.

**Example:**

```tsx
// ❌ Wrong — the tab content pads 12px, the wrapper adds 16px, and the rail floats off the bar
<CdlTabs fill items={stages} activeTab={stage} onTabChange={setStage}>
  <div className="px-4 pt-4">
    <StageSummary />
  </div>
  <CdlDetailPanel title="Details">…</CdlDetailPanel>
</CdlTabs>

// ✅ Right — the tab content hands its edges over, and each child owns its own
<CdlTabs fill items={stages} activeTab={stage} onTabChange={setStage} contentClassName="flex-row gap-0 p-0">
  <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
    <StageSummary />
  </div>
  <CdlDetailPanel title="Details" className="border-l">…</CdlDetailPanel>
</CdlTabs>
```

---

## Adding a rule

When the user reports a new design mistake ("add this to the design standards"):

1. Confirm the correct pattern against the actual component source under `src/components/cdl/` — verify prop names and behavior before writing the rule.
2. Append a numbered rule in the format above. Keep it agnostic: describe the component-usage pattern, not the demo it was found in.
3. If the mistake stems from a missing component capability rather than misuse, flag that instead — that's a `cdl-create-component` enhancement, not a rule.

---

## Concrete pointers live outside this file

This catalog names no file, no client, and no dated decision, so it can be copied into any
project that consumes CDL. A repo that wants concrete pointers — the page that already
implements a rule correctly, and the backlog of pages that still deviate — keeps them in a
local companion file instead. In this repo that is `docs/skill-reference-implementations.md`.

When you add a rule, keep the rule itself agnostic and put the example in the companion
file. Never move a file path, a client name, or a date back into this catalog.

<!-- Mirrored from compassanalytics/compass-design-library (.claude/skills/cdl-design-standards) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->

---
name: cdl-use
description: Reference and build guide for projects using Compass Design Library (CDL) components installed from the registry. Maps UI requirements to the right component, provides prop reference and composition patterns.
user-invocable: true
---

# Compass Design Library — Component Guide

## What this skill covers

This project has CDL components installed from the Compass Design Library registry. Use this guide to:
- Know which component satisfies a given UI requirement
- Install missing components on demand
- Understand props and composition patterns

Registry base URL: `https://cdl-registry.compassdata.workers.dev`

Install a component: `npx shadcn@latest add https://cdl-registry.compassdata.workers.dev/r/<name>.json`

---

## Before you install — project prerequisites

CDL components assume a specific project setup. If any of these are missing, components install into the wrong place or crash at runtime. Verify all three before installing.

### 1. Path alias `@/*` → `src/`

CDL files import via the `@/` alias. The consuming project's `tsconfig.json` must map it to `src/`:

```json
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

And `components.json` `aliases` must match CDL's, so shadcn writes files under `src/` instead of a literal `@/` folder:

```json
"aliases": {
  "components": "@/components",
  "ui": "@/components/ui",
  "lib": "@/lib",
  "hooks": "@/hooks",
  "utils": "@/lib/utils"
}
```

> If files land in a top-level `@/` directory after install, this alias config is wrong or missing.

### 2. React Router provider

`CdlAppSidebar` — and therefore `CdlPageContainer` — calls `useLocation()` to highlight the active nav item. The app **must** be wrapped in a router provider or it throws at runtime:

```tsx
import { BrowserRouter } from "react-router-dom"

<BrowserRouter>
  <App />
</BrowserRouter>
```

### 3. Tailwind CSS v4 + `@source`

CDL is built for Tailwind v4 (it uses v4-only syntax like `w-(--sidebar-width)`). The consuming project must be on v4, and its CSS must point Tailwind at the installed CDL component paths so their utility classes get generated — Tailwind v4 does not scan imported files by default:

```css
@import "tailwindcss";
@source "./components";
@source "./lib";
```

> Without the `@source` directives, layout classes silently fail to generate and components render unstyled or collapsed.

### Dependencies install automatically

The registry declares every transitive dependency (radix primitives, dropdown-menu, the sidebar primitive, etc.), so a single `shadcn add` pulls everything a component needs. You do **not** need to manually `npm install` UI peers.

### When asked to overwrite existing primitives, decline

Installing a CDL component re-resolves its primitive dependencies (button, badge, sidebar, …). Those primitives are **already present** — the project mirrors CDL's primitive set — so `shadcn add` will ask whether to overwrite them. **Answer no / "No to all." Keep the existing files.**

Why: a bare primitive dependency is re-fetched from **upstream shadcn (ui.shadcn.com), not from CDL**, so overwriting can silently replace CDL's tested file with a divergent upstream version (the version-skew problem). The overwrite prompt only fires for files that **already exist**; any primitive the project is genuinely missing is still written automatically. So declining keeps what's correct *and* installs everything new — only the net-new `cdl-*` component files get written.

To update primitives **deliberately**, use the `cdl-primitive-sync` skill (it pulls from CDL, the source of truth) — never an overwrite during `shadcn add`.

---

## Component purity rules

These apply at every step. They are not optional.

1. **Use props and variants, nothing else.** If a component supports it via a prop or a documented variant, use it. If it doesn't, leave it out. Do not add extra elements, wrappers, icons, labels, or decorations that the component doesn't define. **Before writing any custom markup or logic, check the [Component prop reference](#component-prop-reference-auto-generated) below — a prop very often already covers it.**

2. **No CSS overrides.** Do not add `className` overrides that change color, typography, spacing, borders, shadows, or any visual property the component already manages internally. Layout props (`className="flex-1 min-h-0"`, `className="grid grid-cols-4 gap-4"`) on outer containers are fine — visual overrides on component internals are not.

3. **No one-off styled elements alongside CDL components.** Do not create ad-hoc `<div>` / `<span>` constructs that visually extend or embellish a CDL component. If the design calls for something a component doesn't support, flag it as a gap rather than patching around it.

4. **Design refinement is a separate step.** The goal when first building with CDL is a structurally correct, data-wired implementation using components exactly as they are defined. Visual polish, theming, and custom styling come later and are handled deliberately — not inline during the initial build.

---

## Building with CDL — step by step

Follow these steps in order every time you build a new page or feature.

> **Approval gate.** Step 2 always ends with the mapping table shown to the user and a stop. Do not install, scaffold or write any code until the user approves the mapping in a reply. This holds even when every row is ✅, when the request says "just build it", and when you run with auto-accept or in a non-interactive mode — a clean table is not approval.

### Step 1: Understand the requirement

Read the description and extract:
- Every distinct UI element (tables, cards, charts, forms, dialogs, etc.)
- Data requirements (what's shown, whether it's async, whether it's editable)
- Layout requirements (full-height, scrollable, grid, sidebar, etc.)

### Step 2: Map requirements → components

Before writing any code, produce a mapping table using the **Requirement → Component Mapping** and **Component Reference** sections below:

| Requirement | CDL / shadcn Component | Installed? | Notes |
|---|---|---|---|
| … | … | ✅ / ❌ | … |

For the **Installed?** column: check whether the component file exists in the project (e.g. `src/components/cdl/display/cdl-kpi-card.tsx`). Mark ✅ if present, ❌ if missing.

**For every requirement that cannot be satisfied by an existing CDL component:**
- Mark it 🚩
- State exactly what is missing
- Check the full registry (`https://cdl-registry.compassdata.workers.dev/registry.json`) for a matching component
- Propose the simplest path: install from registry, use a shadcn primitive, or flag as a genuine gap

**Then stop, every time.** Show the user the full table, list the components you will install (the ❌ rows), and end your turn with a direct question, for example: "Does this mapping look right? Reply to approve, or tell me what to change." Do not go on to Step 3 in the same turn.

- If the user changes the mapping, update the table, show it again, and wait again.
- Approval of the mapping covers only that table. A requirement added later goes through Step 2 again.
- Do not write any code until the user has approved the table and every 🚩 item is resolved.

### Step 3: Install missing components

Only after the user approves the mapping. For each ❌ component in the approved table:

```bash
npx shadcn@latest add https://cdl-registry.compassdata.workers.dev/r/<name>.json
```

If prompted to overwrite existing primitives, **decline** (see "When asked to overwrite existing primitives, decline" above) — keep the project's CDL-mirrored copies.

### Step 4: Build

With the mapping approved and all components installed:
- Apply the **Component purity rules** above without exception
- **For each component, scan its props in the [Component prop reference](#component-prop-reference-auto-generated) and map your requirements to props/variants first** — only reach for custom code when no prop covers the need (and flag that as a gap)
- Use realistic mock data — domain-appropriate values, not lorem ipsum
- Wire layout first (page shell, panels, grid), then drop in data components

---

## Component prop reference (auto-generated)

> This table is generated directly from each component's TypeScript props at build
> time, so it's always current. **It is the authoritative list of what every
> component supports** — consult it before adding custom markup or logic, since a
> prop usually already covers the need. (Served copy only; the structured form is
> at `https://cdl-registry.compassdata.workers.dev/props.json`.)

Served copy only — see `public/cdl-skill.md` (or the served `cdl-skill.md`) for the prop tables.

### CdlSkeleton

| Prop | Type | Description |
|---|---|---|
| `className?` | `string` |  |
| `variant?` | `"line" \| "circle" \| "rectangle"` |  |

### CdlCard

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlCardHeader

| Prop | Type | Description |
|---|---|---|
| `title` | `string` | Header label. |
| `description?` | `string` | Secondary line beneath the title. |
| `actions?` | `React.ReactNode` | Trailing controls (buttons, a counter, a menu). |
| `icon?` | `React.ReactNode` | Leading icon rendered before the title, e.g. an 15px Phosphor icon. |
| `size?` | `"default" \| "md" \| "sm"` | Type scale, largest to smallest. `"default"` is the 16px page/panel header. Step down where the card sits inside denser content — a chat message, a sidebar, a nested block — so its header doesn't outweigh the surrounding text: `"md"` is 14px (matches body copy), `"sm"` is 13px. |

### CdlCardContent

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlCardFooter

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlStatusLabel

| Prop | Type | Description |
|---|---|---|
| `tone` | `CdlStatusTone` | Which tone to render: "ok", "warn", "error", or "neutral". Sets the colour and the default icon. |
| `label` | `string` | The status word shown beside the icon. |
| `description?` | `string` | Short sentence explaining what this status means, shown on hover. |
| `className?` | `string` | Class names merged onto the label, after its defaults. |
| `icon?` | `Icon` | Overrides the tone's default icon. For a status whose tone is right but whose default icon is not — a quiet "Watch" tier reads as a disabled row with `neutral`'s filled dot, and as an eye it reads as what it is. |
| `iconWeight?` | `"fill" \| "regular" \| "bold"` | Phosphor weight for the icon. A quiet tier is better as an outline. |

### CdlTag

| Prop | Type | Description |
|---|---|---|
| `label` | `string` |  |
| `onDelete?` | `() => void` |  |
| `className?` | `string` |  |

### CdlEmptyState

| Prop | Type | Description |
|---|---|---|
| `icon` | `LucideIcon` |  |
| `title` | `string` |  |
| `description` | `string` |  |
| `variant?` | `keyof typeof tintStyles` |  |
| `actions?` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlProgress

| Prop | Type | Description |
|---|---|---|
| `value` | `number` | Current value on the scale, e.g. amount spent. Clamped into 0–max. |
| `max?` | `number` | Upper bound of the scale. The fill width is `value / max`. Defaults to 100. |
| `marker?` | `number` | Optional target/pace marker in the same units as `value` (e.g. "% of year elapsed"). Renders a thin vertical line on the track so you can read the value against a goal or pace. Omit for a plain fill bar. |
| `markerLabel?` | `string` | Tooltip / accessible description for the marker line (e.g. "55% of year elapsed"). |
| `variant?` | `CdlProgressVariant` | Fill color intent. `default` uses the primary brand color; the others map to semantic status colors. |
| `size?` | `CdlProgressSize` | Track thickness. Defaults to `md`. |
| `label?` | `string` | Accessible label for the bar, read by screen readers (e.g. "Budget spent"). |
| `loading?` | `boolean` | Show a skeleton placeholder while async data loads. |
| `className?` | `string` |  |

### CdlKpiCard

| Prop | Type | Description |
|---|---|---|
| `density?` | `"compact" \| "default"` | Vertical density. `"default"` reserves a fixed 110px height and pushes the header and the value to opposite ends, so a row of cards keeps one rhythm however much each card holds. `"compact"` drops the reserved height and stacks the header directly above the value, which roughly halves the card — use it when the metrics are a summary strip above the real content and the vertical space is better spent below. Compact scales the type down one step with the box (header to `text-xs`, value to `text-lg`), so it stays legible rather than just squashed. |
| `header?` | `string` | Small muted label shown at the top of the card. |
| `headerClassName?` | `string` | Class names for the header text, merged after the default (small muted label). Use to restyle the header per-instance, e.g. a bolder heading: `"text-lg font-semibold text-foreground"`. |
| `value?` | `string` | Primary metric value, rendered large. |
| `change?` | `number` | Period-over-period change as a percentage; renders an up/down arrow and color. |
| `changePeriod?` | `string` | Label describing the comparison period, e.g. "vs last month" |
| `icon?` | `LucideIcon` | Optional icon shown at the top-right. |
| `iconClassName?` | `string` | Class names for the icon, merged after the default (`text-muted-foreground`). Use to color it for urgency, e.g. a status dot — `"text-amber-500 fill-amber-500"` on a filled `Circle` icon. Leave unset for the default quiet, muted styling. |
| `progress?` | `number` | Progress fill from 0–100, shown as a bar beneath the value. |
| `children?` | `React.ReactNode` | Custom body content, rendered beneath the metric block (value/change/progress). Provide it alongside those props to add a breakdown list, custom bar, or multi-line summary, or on its own to fully replace the metric block. |
| `href?` | `string` | Drill-down target. With `linkText`, renders a footer link so the card always offers a drill path. |
| `linkText?` | `string` | Text for the footer drill-down link (requires `href`). |
| `loading?` | `boolean` | Show a skeleton placeholder while async data loads. |
| `className?` | `string` |  |

### CdlSonner

| Prop | Type | Description |
|---|---|---|
| `position?` | `"top-left" \| "top-center" \| "top-right" \| "bottom-left" \| "bottom-c…` |  |
| `offset?` | `string \| number \| { top?: string \| number; right?: string \| number;…` | Distance from the viewport edges, as one value for every edge or a `{ top, right, bottom, left }` object. Raise the edge a toast rises from when a page pins a control there — a sticky footer action, a floating button — so the toast never covers it. Defaults to Sonner's own 24px. |
| `richColors?` | `boolean` |  |
| `expand?` | `boolean` |  |
| `duration?` | `number` |  |
| `visibleToasts?` | `number` |  |
| `closeButton?` | `boolean` |  |
| `className?` | `string` |  |

### CdlDialogContent

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |
| `"data-theme"?` | `string` |  |
| `standalone?` | `boolean` | Render as a plain div panel (no portal/overlay) — for Storybook previews. |

### CdlDialogHeader

| Prop | Type | Description |
|---|---|---|
| `title` | `string` |  |
| `actions?` | `React.ReactNode` |  |
| `standalone?` | `boolean` | Render without DialogClose (for use outside a Dialog context, e.g. Storybook previews). |

### CdlDialogBody

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` | Extra classes merged onto the body. Padding defaults to `p-3` (matching the header/footer inset); pass another `p-*` class to change it, or `p-0` for flush content such as a full-bleed table or image. |

### CdlDialogFooter

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlBanner

| Prop | Type | Description |
|---|---|---|
| `severity?` | `CdlBannerSeverity` | Severity — sets the default icon and its accent colour. Defaults to `"info"`. |
| `title` | `React.ReactNode` | Bold primary line. Keep it short — it's the headline a scanning user reads first. |
| `description?` | `React.ReactNode` | Optional secondary text in muted color. Explains or qualifies the title; long text wraps onto multiple lines. |
| `action?` | `CdlBannerAction` | Optional trailing call-to-action, rendered as a primitive Button (link or button). |
| `icon?` | `Icon` | Override the default severity icon (any Phosphor icon). |
| `onDismiss?` | `() => void` | When provided, renders a dismiss (×) button on the right: a plain icon button labelled "Dismiss", with a focus ring. |
| `className?` | `string` | Extra classes on the banner root. |

### CdlActionBar

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Whether the bar is visible. Applies CSS transition for enter/exit. |
| `count?` | `number` | Number of selected items shown on the left. |
| `countLabel?` | `string` | Text after the count number (default "Rows Selected"). |
| `actions?` | `CdlActionBarAction[]` | Optional context-specific action buttons, rendered between the count and the fixed Deselect/Delete buttons. |
| `variant?` | `"floating" \| "docked"` | Where the bar sits. "floating" (the default) is the pill that hovers over the content — right for a bar that overlays a table the reader is still scrolling. "docked" is a full-width bar flush against the bottom edge of its container, with the selection and Deselect on the left and the actions on the right. Right where the bar belongs to one working surface and should not cover any of it. |
| `onDeselect?` | `() => void` | Called when Deselect is clicked. |
| `onDelete?` | `() => void` | Called when Delete is confirmed. Always gated by a confirmation dialog. |
| `deleteConfirmTitle?` | `string` | Title for the delete confirmation dialog. |
| `deleteConfirmDescription?` | `string` | Description for the delete confirmation dialog. |
| `className?` | `string` |  |

### CdlDataForm

| Prop | Type | Description |
|---|---|---|
| `fields` | `CdlDataFormField[]` |  |
| `values` | `Record<string, string>` |  |
| `onChange?` | `(values: Record<string, string>) => void` |  |
| `className?` | `string` |  |
| `readOnly?` | `boolean` |  |

### CdlTable

| Prop | Type | Description |
|---|---|---|
| `data` | `TData[]` |  |
| `columns` | `CdlTableColumn<TData>[]` |  |
| `emptyState?` | `React.ReactNode` |  |
| `loading?` | `boolean` |  |
| `loadingRows?` | `number` |  |
| `loadingColumns?` | `number` |  |
| `caption?` | `string` |  |
| `rowClassName?` | `(row: TData) => string` |  |
| `className?` | `string` |  |

### CdlDataTableFilter

| Prop | Type | Description |
|---|---|---|
| `fields` | `FieldConfig[]` | Field definitions — each field has a key, label, allowed operators, and selectable options. |
| `filters` | `CdlFilterCondition[]` | The current list of active filter conditions. |
| `onChange` | `(filters: CdlFilterCondition[]) => void` | Called whenever filters are added, updated, or removed. |
| `defaultOpen?` | `boolean` | Open the filter panel on initial render. Useful for Storybook and testing. |

### CdlCombobox

| Prop | Type | Description |
|---|---|---|
| `options` | `CdlComboboxOptionInput[]` | The selectable options. Strings are shorthand for `{ value, label }`. |
| `placeholder?` | `string` | Trigger text when nothing is selected, e.g. "All partners". |
| `searchPlaceholder?` | `string` | Placeholder inside the search field. Defaults to "Search…". Name the fields the search covers — the label, the value and the hint all match. |
| `emptyMessage?` | `string` | Shown when the search matches no options. Defaults to "No matches found.". |
| `disabled?` | `boolean` | Disables the trigger and prevents opening. |
| `loading?` | `boolean` | Renders skeleton rows instead of options — for options still being fetched. The trigger stays interactive so the popover can be opened to show progress. |
| `align?` | `"start" \| "center" \| "end"` | Alignment of the popover relative to the trigger. Defaults to "start". |
| `hideSearch?` | `boolean` | Hides the search field. Use for short, scannable lists. |
| `className?` | `string` | Extra classes for the trigger button — width is usually set here. |
| `contentClassName?` | `string` | Extra classes for the popover panel. |
| `"aria-label"?` | `string` | Accessible name for the trigger, when no visible label is associated. |
| `mode?` | `"single" \| "multi"` | Selection mode — one option (the default), or several with mode="multi". |
| `value?` | `string \| string[]` | The selected value, or undefined when nothing is selected. |
| `onChange?` | `((value: string \| undefined) => void) \| ((value: string[]) => void)` | Called with the new value, or undefined when the selection is cleared. |
| `clearable?` | `boolean` | Allows re-clicking the selected row to deselect it. |
| `selectAll?` | `boolean` | Shows a tri-state Select all row above the list: one click selects everything, a second clears it, and a partial selection fills up first. While a search is active it acts only on the matches. Defaults to true. |
| `summaryNoun?` | `string` | Plural noun for the multi-selection summary, e.g. "partners" renders as "3 partners". Defaults to "selected". |

### CdlDatePicker

| Prop | Type | Description |
|---|---|---|
| `disabled?` | `boolean` | Disables the trigger button and prevents opening the calendar. |
| `placeholder?` | `string` | Text shown in the trigger when nothing is selected. |
| `align?` | `"start" \| "center" \| "end"` | Alignment of the calendar popover relative to the trigger. |
| `minDate?` | `Date` | The earliest date that can be picked. Earlier days show disabled. |
| `className?` | `string` | Additional class names applied to the trigger button. |
| `mode?` | `"single" \| "range"` | Selects a single date. |
| `value?` | `Date \| DateRange` | The selected date. |
| `onChange?` | `((date: Date \| undefined) => void) \| ((range: DateRange \| undefined…` | Called when the selected date changes. |
| `numberOfMonths?` | `number` | Number of months shown side by side in the popover. Defaults to 2. |

### CdlTableConfiguratorPanel

| Prop | Type | Description |
|---|---|---|
| `columns` | `CdlColumnConfig[]` |  |
| `onApply` | `(columns: CdlColumnConfig[]) => void` |  |
| `onReset?` | `() => void` |  |
| `reorderable?` | `boolean` | Set false to hide the drag handles and disable column reordering. |

### CdlTableConfigurator

| Prop | Type | Description |
|---|---|---|
| `columns` | `CdlColumnConfig[]` |  |
| `onChange` | `(columns: CdlColumnConfig[]) => void` |  |
| `defaultOpen?` | `boolean` |  |
| `variant?` | `"dialog" \| "dropdown"` | "dialog" for heavy tables with many columns, "dropdown" for simple tables. |
| `reorderable?` | `boolean` | Set false to hide the drag handles and disable column reordering. |

### CdlDataTable

| Prop | Type | Description |
|---|---|---|
| `data?` | `TData[]` | The data array to render in the table. |
| `columns?` | `ColumnDef<TData>[]` | TanStack column definitions. |
| `filterFields?` | `FieldConfig[]` | Optional filter field config. Omit to hide the filter bar. |
| `toolbarActions?` | `React.ReactNode` | Extra toolbar content rendered in the toolbar row, between the built-in filter bar and the Columns control — e.g. a button that opens a page-owned filter drawer. Providing it forces the toolbar row to render (unless `hideToolbar` is set), so it works on tables that use none of the built-in toolbar features. |
| `columnToggle?` | `"dialog" \| "dropdown" \| "none"` | Column visibility toggle variant. "dropdown" (default) for simple tables, "dialog" for heavy tables, "none" to hide the Columns button entirely (e.g. file browsers where the columns are fixed). Pair with `meta: { defaultHidden: true }` on a column to ship it switched off but still reachable here — with "none" there is no way to switch it back on. |
| `variant?` | `"default" \| "plain"` | Visual style of the table. "plain" removes the header row background and all vertical grid lines for a lighter, list-like look (file browsers, simple lists) — horizontal row dividers remain. "default" keeps the full bordered grid. |
| `density?` | `"compact" \| "default" \| "comfortable"` | Vertical density of the rows. "compact" tightens header and body cell heights for dense, data-heavy tables; "comfortable" adds breathing room for lighter, more readable lists (and slightly wider horizontal cell padding so columns feel less cramped); "default" is the standard height. Affects both the header and body rows (and the loading skeleton). |
| `rowClassName?` | `(row: TData) => string` | Optional callback to add className to a row based on its data. |
| `cellClassName?` | `(row: TData, columnId: string) => string` | Optional callback to add className to a cell based on row data and column id. |
| `disableRowHover?` | `boolean` | Disables the row hover highlight. Useful for read-only / diff tables where hover feedback is noise. |
| `loading?` | `boolean` | Show skeleton loading state. |
| `skeletonRows?` | `number` | Number of skeleton rows in the loading state (default 5). |
| `skeletonColumns?` | `number` | Number of skeleton columns in the loading state (default 4). |
| `onRowClick?` | `(row: TData) => void` | Optional callback fired when a row is clicked. |
| `onRowDoubleClick?` | `(row: TData) => void` | Optional callback fired when a row is double-clicked. Combine with `onRowClick` for the desktop file-browser pattern — single-click to select/preview, double-click to open (note both `onRowClick` calls still fire on the way to a double-click). |
| `selectOnRowClick?` | `boolean` | When set (with `enableSelection`), a single click anywhere on a row toggles its selection checkbox — including shift-click to select a range — for a file-browser model where clicking selects and double-click opens. Interactive cells (the checkbox, row actions, inline edits) still handle their own clicks. |
| `disableRowCursor?` | `boolean` | Suppress the pointer cursor on rows even when they have click handlers — e.g. when a single click selects rather than navigates, so rows don't read as links. Defaults to false (clickable rows show a pointer). |
| `showRowClickIcon?` | `boolean \| ((row: TData) => boolean)` | Controls the hover "open" icon shown in the leading cell of clickable rows (only relevant when `onRowClick` is set). Defaults to `true`. Pass `false` to hide it entirely, or a predicate to show it per row — e.g. show it for files but not folders, which still navigate on click without the icon. |
| `showSearch?` | `boolean` | Show a search input that filters across all columns. |
| `emptyState?` | `React.ReactNode` | Custom empty state when there are no rows (after filters/search). A plain string gets the default centered layout with just the copy swapped; pass an element (e.g. CdlEmptyState) to own the layout entirely. |
| `caption?` | `string` | Optional accessible name for the table (rendered as a visually-hidden caption). |
| `onDeleteRow?` | `(row: TData) => void` | Optional callback fired when the delete button is clicked on a row. Adds an X column as the last column. |
| `rowMenu?` | `(row: TData) => (CdlDataTableRowMenuItem \| CdlDataTableRowMenuSepar…` | Adds an ellipsis (⋯) column as the last column, styled like the `onDeleteRow` column, that opens a dropdown of per-row actions. Return the items for the row; add `{ separator: true }` between groups. Returning an empty array hides the trigger for that row. Clicking the trigger or an item does not fire `onRowClick`. If `onDeleteRow` is also set, `rowMenu` wins and the X column is not rendered — add a destructive Delete item to the menu instead. It coexists with `rowActions`, which sits to its left. |
| `rowActions?` | `(row: TData) => React.ReactNode` | Optional render function for a sticky actions column. Receives the row and returns a ReactNode. Pinned to the right of the table. |
| `rowActionsWidth?` | `number` | Width of the `rowActions` column in pixels. Defaults to 40 — room for one icon button. Widen it when the control carries a label, e.g. when the column states the row's status as well as offering the action on it. |
| `rowActionsHeader?` | `React.ReactNode` | Optional header for the `rowActions` column. Defaults to none, which is right for a column of icon buttons; give it a label once the column is wide enough to read as a column of its own. |
| `enableSelection?` | `boolean` | Enable checkbox row selection. Adds a checkbox column as the first column. |
| `onSelectionChange?` | `(selectedRows: TData[]) => void` | Called whenever the selection changes. Receives the array of selected row data objects. |
| `getRowId?` | `(row: TData, index: number) => string` | Return a stable string ID for each row. Used to keep selection intact when rows are re-sorted or filtered. Defaults to the row index — provide a real ID (e.g. `(row) => row.id`) for stable selection. |
| `resetSelectionOn?` | `number` | Increment this value to programmatically clear all checkbox selections. Useful when a parent action bar needs to deselect rows after a bulk action. |
| `defaultSorting?` | `SortingState` | Initial sort applied on first render (uncontrolled). Seeds the header sort indicator so a table can open already sorted — e.g. `[{ id: "name" }]` for A→Z. Ignored when `sorting` (controlled mode) is provided. |
| `sorting?` | `SortingState` | Controlled sort state. Provide together with `onSortingChange` to own sorting yourself: the table shows the header indicator from this value but does NOT reorder rows (manual sorting) — pass your `data` already sorted the way this state describes. Use this when the built-in per-column sort isn't enough, e.g. to keep a group (folders) pinned above files regardless of the sort column or direction. |
| `onSortingChange?` | `OnChangeFn<SortingState>` | Called when the user toggles a column header, in controlled mode. Receives a TanStack updater — resolve it against your current sort state, then re-sort your data to match. Only used when `sorting` is also provided. |
| `getSubRows?` | `(row: TData) => TData[] \| undefined` | Returns the children of a row. Passing this prop turns on drill-down: each row whose result is non-empty gets a chevron in the leading cell, and children are rendered inline with progressive indentation. |
| `defaultExpanded?` | `true \| Record<string, boolean>` | Initial expansion state for drill-down. Pass `true` to expand everything, or a record keyed by row id (matching `getRowId`) to expand specific rows. Defaults to all rows collapsed. |
| `resetExpansionOn?` | `number` | Increment this value to programmatically apply `defaultExpanded` to the current expanded state, collapsing or expanding all rows without remounting the table. Mirrors the `resetSelectionOn` pattern. |
| `onPendingEditsChange?` | `(count: number, changes: CdlCellEdit<TData>[]) => void` | Called whenever the set of staged (uncommitted) cell edits changes. Receives the total count and the full change list — use this to drive a CdlActionBar with Save / Discard controls. Columns opt in to inline editing via `meta: { editable: true }`. Editable cells take spreadsheet keys: Enter commits and moves down (Shift+Enter up), Tab and Shift+Tab move across editable cells (row controls between cells stay in the Tab order), Escape restores the value from when the cell took focus. |
| `clearEditsOn?` | `number` | Increment this value to programmatically clear all staged cell edits. Mirrors the `resetSelectionOn` pattern — increment after a save or discard. |
| `onAddRow?` | `() => void` | When provided, renders a full-width "+ Add New Row" button. Clicking it fires this callback — the parent handles creating the new row. |
| `addRowLabel?` | `string` | Label for the add-row button. Defaults to "Add New Row". |
| `addRowPosition?` | `"inline" \| "sticky"` | Controls where the add-row button is rendered. - `"inline"` (default): button is a table row immediately after the last data row. - `"sticky"`: button sticks to the bottom of the scroll container, always visible. |
| `hideToolbar?` | `boolean` | Hides the toolbar (search, filters, collapse/expand button) entirely. |
| `toolbarContent?` | `React.ReactNode` | Extra controls rendered inside the toolbar row — after the built-in search/filter controls, before the right-aligned expand/collapse button. Setting it forces the toolbar to render. Size custom controls to the toolbar's h-7 rhythm (e.g. `size="xs"` buttons, `!h-7` select triggers) so they line up with the built-ins. |
| `showFooter?` | `boolean` | Renders a totals row under the body, built from each column's `footer` in its `ColumnDef`. Use it where a figure stated elsewhere on the page is the sum of a column, so the reader can tie the two without adding up rows. Columns with no `footer` render empty. Pinned columns (the select checkbox, `pinFirstColumn`, `rowActions`, `rowMenu`, `onDeleteRow`) stay pinned in the totals row too. The row sits directly under the last body row: setting `showFooter` implies `noFill`, so there is no filler row between them. The row is not sticky vertically. |
| `noFill?` | `boolean` | Suppresses the filler row that extends column grid lines to the bottom of the container. |
| `fixedLayout?` | `boolean` | Locks column widths using table-layout: fixed, preventing shifts when rows expand or collapse. Only columns that explicitly set a `size` are pinned to that width; columns without a `size` are left `auto` and share the remaining space equally. So to cap one column and let the rest distribute across the full width, give just that column a `size` and leave the others unset. |
| `scrollable?` | `boolean` | Enables vertical scrolling within the component's own scroll container. The header row stays fixed via `position: sticky` while body rows scroll. The component fills whatever height its parent provides — use a flex/grid layout or `h-full` on a height-constrained ancestor to bound the height. |
| `pinFirstColumn?` | `boolean` | Pins the first data column to the left so it stays visible while the table scrolls horizontally. The header, body, and filler cells of that column all become `position: sticky`. When `enableSelection` is on, the pinned column sits just to the right of the checkbox column. Pairs naturally with wide tables; combine with `scrollable` when the table also scrolls vertically. |
| `alwaysShowScrollbar?` | `boolean` | Forces the horizontal scrollbar to remain permanently visible instead of appearing only on hover. Useful for wide tables where users need to know at a glance that more columns exist off-screen. |
| `pageSize?` | `number` | Enables pagination, rendering this many rows per page with controls below the table. Omit to render all rows (default). Ignored when `getSubRows` (drill-down) is set — pagination only applies to flat tables. The table sizes to its content while paginated, as if `noFill` were set. |
| `pageSizeOptions?` | `number[]` | Page-size choices shown in a "Rows per page" selector next to the pagination controls. Only used when `pageSize` is also set. |

### CdlChartTooltip

| Prop | Type | Description |
|---|---|---|
| `active?` | `boolean` |  |
| `payload?` | `TooltipEntry[]` |  |
| `label?` | `string` |  |

### CdlAreaChart

| Prop | Type | Description |
|---|---|---|
| `data` | `Record<string, unknown>[]` |  |
| `xKey` | `string` |  |
| `series` | `CdlAreaChartSeries[]` |  |
| `height?` | `number` |  |
| `className?` | `string` |  |
| `stacked?` | `boolean` |  |
| `showGrid?` | `boolean` |  |
| `showLegend?` | `boolean` |  |
| `showDots?` | `boolean` |  |
| `fillOpacity?` | `number` |  |

### CdlBarChart

| Prop | Type | Description |
|---|---|---|
| `data` | `Record<string, unknown>[]` |  |
| `xKey` | `string` |  |
| `series` | `CdlBarChartSeries[]` |  |
| `height?` | `number \| string` |  |
| `className?` | `string` |  |
| `stacked?` | `boolean` |  |
| `sharedSlot?` | `boolean` | Draws every series in the same category slot instead of side by side. Use it when only one series carries a value per category — a signed variance split into an "over" and an "under" series, for example. Grouped bars reserve a slot for the series that has no value, so the drawn bar sits off to one side of its tick; this puts it back on the tick and keeps its rounded cap. `stacked` takes precedence when both are set. |
| `showGrid?` | `boolean` |  |
| `showLegend?` | `boolean` |  |
| `yAxisTicks?` | `number[]` |  |
| `yTickFormatter?` | `(value: number) => string` | Formats each value-axis tick label (the numeric axis — vertical in `layout="vertical"`, horizontal in `layout="horizontal"`). Use this for large numbers (currency, token counts) so labels stay compact (e.g. `1.5M`) instead of rendering the raw value (`1500000`), which is wide enough to clip against the chart edge. |
| `layout?` | `"vertical" \| "horizontal"` | Bar orientation. `"vertical"` (default) draws columns growing upward along a horizontal category axis. `"horizontal"` draws bars growing rightward along a vertical category axis — better for long category labels or ranked lists. |
| `categoryAxisWidth?` | `number` | Width reserved for the category axis labels when `layout="horizontal"`. |
| `xAxisLabel?` | `string` | Title rendered below the X-axis tick labels, e.g. "Month". Reserves extra bottom room automatically. |
| `yAxisLabel?` | `string` | Title rendered alongside the Y-axis tick labels, rotated vertically, e.g. "Cost ($M)". Reserves extra left room automatically. |

### CdlLineChart

| Prop | Type | Description |
|---|---|---|
| `data` | `Record<string, unknown>[]` |  |
| `xKey` | `string` |  |
| `series` | `CdlLineChartSeries[]` |  |
| `height?` | `number \| string` | Chart height. A number is px; a CSS string (e.g. "100%") fills a height-bounded parent. Default 300. |
| `className?` | `string` |  |
| `showGrid?` | `boolean` |  |
| `showLegend?` | `boolean` |  |
| `showDots?` | `boolean` |  |
| `yTickFormatter?` | `(value: number) => string` | Formats each Y-axis tick label. Use this for large numbers (currency, counts) so labels stay compact (e.g. `$2.5M`) instead of rendering the raw value (`2500000`), which is wide enough to clip against the chart edge. When provided, the chart also reserves extra left room for the labels. |
| `yAxisTicks?` | `number[]` | Explicit Y-axis tick values, e.g. `[0, 2, 4, 6, 8]`. Also fixes the axis domain to the ticks' min/max so the scale doesn't auto-fit to the data. |
| `variant?` | `"monotone" \| "linear"` | Line interpolation style. `"monotone"` (default) draws a smoothed curve through the data points. `"linear"` draws straight segments point-to-point. |
| `xAxisPadding?` | `number` | Horizontal inset, in px, between the plot edges and the first/last data point. Defaults to 16, which keeps the first X tick label clear of the Y axis's baseline label — without it, a "0" (or "$0.00") tick and the first month label sit on top of each other in the corner. It also stops the last point and its label from touching the right edge. Set `0` for an edge-to-edge line (e.g. a dense series where the inset reads as dead space). |

### CdlComboChart

| Prop | Type | Description |
|---|---|---|
| `data` | `Record<string, unknown>[]` | Array of data rows, each keyed by `xKey` plus one key per series. |
| `xKey` | `string` | Key in each data row used for the x-axis category. |
| `series` | `CdlComboChartSeries[]` | Series to render, each drawn as either a bar or a line onto a single shared Y-axis. |
| `height?` | `number \| string` | Chart height in pixels, or `"100%"` to fill the parent container. |
| `className?` | `string` |  |
| `stacked?` | `boolean` | Stack bar series on top of each other. Line series are unaffected. |
| `showGrid?` | `boolean` | Show horizontal grid lines. |
| `showLegend?` | `boolean` | Show the legend. |
| `legendPosition?` | `"top-left" \| "bottom"` | Where the legend sits. `"top-left"` (default) puts it above the plot, aligned to the left edge — it reads as a key to the series before you look at the marks, and it keeps clear of `xAxisLabel`, which occupies the same band as a bottom legend. `"bottom"` centers it below the chart instead. |
| `showDots?` | `boolean` | Show dots on line series. |
| `yTickFormatter?` | `(value: number) => string` | Formats each Y-axis tick label, e.g. for compact large numbers (`$2.5M`). |
| `yAxisTicks?` | `number[]` | Explicit Y-axis tick values. Also fixes the axis domain to the ticks' min/max. |
| `xAxisLabel?` | `string` | Title rendered below the X-axis tick labels, e.g. "Questions in a day". Reserves extra bottom room automatically. |
| `yAxisLabel?` | `string` | Title rendered alongside the Y-axis tick labels, rotated vertically, e.g. "# of days". Reserves extra left room automatically. |

### CdlDrillDownBarChart

| Prop | Type | Description |
|---|---|---|
| `levels` | `DrillLevel[]` | Ordered levels, top (index 0) to deepest. Clicking a bar drills to the next. |
| `height?` | `number` | Chart height in pixels. |
| `valueFormatter?` | `(n: number) => string` | Formats the y-axis ticks, tooltip value, and bar labels. |
| `onLeaf?` | `(path: string[], bar: DrillBar) => void` | Fired when a bar at the deepest level is clicked (the leaf drill target). |
| `path?` | `string[]` | The drill path, for controlled mode: the keys clicked to reach the level shown, top to current. Pass it with `onPathChange` when something outside the chart has to follow the drill — a table filtered to the bar, or a URL. Omit both and the chart holds its own path. |
| `onPathChange?` | `(path: string[]) => void` | Called whenever the drill path changes: a bar drilled into, a breadcrumb climbed, or the reset button. Not called for a leaf click, which is `onLeaf`. |
| `hideYAxis?` | `boolean` | Drops the value axis and its gridlines, for a chart whose bars carry their own value labels and whose scale says nothing more. Fit-to-width levels only: a level that scrolls keeps its pinned axis. |
| `maxVisibleBars?` | `number` | How many bars fit on screen at once. When a level has more bars than this, the chart stops squeezing them to fit: bars keep a readable width, the plot scrolls horizontally with the y-axis pinned in place, and a draggable minimap of the whole level appears below the chart. Drag the highlighted window to scroll, or click anywhere on the minimap to jump there. Omit to always compress every bar into the available width (the default). |
| `className?` | `string` |  |

### CdlPieChart

| Prop | Type | Description |
|---|---|---|
| `data` | `Record<string, unknown>[]` |  |
| `nameKey` | `string` |  |
| `valueKey` | `string` |  |
| `slices` | `CdlPieChartSlice[]` |  |
| `height?` | `number \| string` |  |
| `className?` | `string` |  |
| `donut?` | `boolean` |  |
| `showLegend?` | `boolean` |  |
| `showValues?` | `"value" \| "percent" \| "both"` | Draws each slice's value on the chart, so the figures read without a hover. `"value"` writes the raw value through `valueFormatter`; `"percent"` writes the slice's share of the total; `"both"` writes the value then the percent. Omit to leave the values in the tooltip only. Labels sit inside the slices by default, in the `primary-foreground` token, and a slice under 5% is left unlabelled so it cannot overlap its neighbours. If your palette runs light, pass `labelsOutside` — an inside label needs a dark enough fill to read against. |
| `valueFormatter?` | `(value: number) => string` | Formats the raw value in a label and in the tooltip — e.g. `(v) => \`$\${v}M\``. Defaults to the value's own locale string. Percentages are formatted by `percentDigits` instead. |
| `percentDigits?` | `number` | Decimal places on a percentage label. Defaults to 0. |
| `labelsOutside?` | `boolean` | Places the value labels outside the slices, with a leader line. Use it when the slices are too small or too dark to carry a label inside them. Costs horizontal room, so the chart draws a smaller circle to make space. |

### CdlRadialGauge

| Prop | Type | Description |
|---|---|---|
| `value` | `number` | The value the arc represents (e.g. dollars spent, percent complete). Clamped to 0–max. |
| `max?` | `number` | Upper bound of the scale. The arc fills `value / max` of the sweep. Defaults to 100. |
| `valueLabel?` | `string` | Large text shown in the centre of the ring. Defaults to `value` formatted with thousands separators. Pass a preformatted string (e.g. "$17.6M") to control units. |
| `sublabel?` | `string` | Small muted line rendered under the value label (e.g. "of $16.8M budget"). Omit for none. |
| `variant?` | `CdlRadialGaugeVariant` | Fill color by semantic status: primary / success / warning / danger. Defaults to "default". |
| `target?` | `number` | Optional target/goal marker in the same units as `value` (e.g. the budget on a spend gauge). Renders a tick across the ring so you can read the fill against the goal — leave `max` above the target so an over-target fill visibly crosses the tick. Omit for no marker. |
| `targetLabel?` | `string` | Accessible / tooltip description for the target tick (e.g. "$16.8M budget"). |
| `startAngle?` | `number` | Start angle of the sweep in degrees (12 o'clock = 90). Defaults to 90. |
| `endAngle?` | `number` | End angle of the sweep in degrees. Defaults to -270 (a full clockwise circle). For a 270° gauge use -180. |
| `size?` | `number` | Diameter of the gauge in pixels. Defaults to 200. |
| `loading?` | `boolean` | When true, renders a circular skeleton in place of the chart while data loads. |
| `tooltip?` | `ReactNode` | Optional rich content shown in a tooltip when the gauge is hovered (e.g. a small breakdown of the underlying figures). Omit for no tooltip. |
| `tooltipClassName?` | `string` | Class names applied to the tooltip surface, e.g. to switch it to a light theme (`"bg-popover fill-popover text-popover-foreground shadow-md"`). Include `fill-*` so the arrow matches the surface; prefer a shadow over a border, since the arrow can't take a border. Merged after the default dark styling. |
| `className?` | `string` |  |

### CdlChatEmptyState

| Prop | Type | Description |
|---|---|---|
| `icon?` | `LucideIcon \| React.ReactNode` | A LucideIcon component or any ReactNode to render inside the icon container. |
| `title?` | `string` |  |
| `description?` | `string` |  |

### CdlSuggestedReplies

| Prop | Type | Description |
|---|---|---|
| `replies` | `string[]` | Replies to offer, in display order. Each is sent as the user's next message, verbatim. |
| `onSelect` | `(reply: string) => void` | Called with the reply's text when the user picks one. Send it as a user message. |
| `disabled?` | `boolean` | Disables every row, e.g. while an answer is loading or streaming. |
| `className?` | `string` |  |

### CdlResponseMeta

| Prop | Type | Description |
|---|---|---|
| `sourceCount?` | `number` | Total source count, e.g. 6 — rendered as "6 Sources". |
| `sources?` | `MessageSource[]` | Source images shown as overlapping icon circles (up to 4, rest as "+N"). |
| `onCopy?` | `() => void` |  |
| `onDownload?` | `() => void` |  |
| `onThumbsUp?` | `() => void` |  |
| `onThumbsDown?` | `() => void` |  |
| `onSourcesClick?` | `() => void` | Called when the user clicks the sources group button. |
| `showFeedback?` | `boolean` | Show the thumbs-up / thumbs-down feedback buttons. Default true. |
| `className?` | `string` |  |

### CdlSourceIcon

| Prop | Type | Description |
|---|---|---|
| `source` | `MessageSource` |  |
| `size?` | `SourceIconSize` |  |
| `className?` | `string` |  |

### CdlSourceCard

| Prop | Type | Description |
|---|---|---|
| `source` | `MessageSource` | The source to display. |
| `onPreview?` | `() => void` | Called when the Preview button is clicked. Omit to hide the button. |
| `onOpen?` | `() => void` | Called when the Open button is clicked. Omit to hide the button. |
| `loading?` | `boolean` | Renders skeleton placeholders instead of content. |
| `className?` | `string` |  |

### CdlStepDocuments

| Prop | Type | Description |
|---|---|---|
| `documents` | `StepDocument[]` | Documents the step went through — each rendered as an icon + name badge. |
| `max?` | `number` | Max badges to show before the rest collapse behind a "+N more" pill. Default 4. |
| `maxWidth?` | `string \| number` | Max width of the wrapping badge container. Default "360px". |
| `className?` | `string` |  |

### CdlReasoningStep

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | The step's primary label, e.g. "Searched" or "Donna answered". |
| `variant?` | `ReasoningStepVariant` | Which variant to render: - "text" — an action label with an optional reasoning paragraph below it. - "sources" — an action label plus a wrapped row of document badges. When omitted, defaults to "sources" if `documents` is passed, else "text". |
| `icon?` | `ReasoningStepIcon \| LucideIcon` | Icon shown before the label to signal the action — a named kind ("search", "thought", …) or any Lucide icon. |
| `state?` | `ThinkingStepState` | Lifecycle state. When set it takes over the icon slot from `icon` and tints the label: "running" goes full-foreground and medium-weight, "failed" keeps the label readable but marks the rail, everything else stays muted. Leave it off in a finished reasoning panel, where every step is done and the action icon is the more useful signal. |
| `description?` | `string` | Optional reasoning/description prose shown as a muted paragraph beneath the label. |
| `duration?` | `string` | Optional short duration shown muted after the label, e.g. "2s". |
| `fileRef?` | `string` | Optional filename/tag appended to the label (legacy inline reference). |
| `suffix?` | `string` | Optional suffix after the label, e.g. "...". |
| `documents?` | `StepDocument[]` | Documents/sources the step went through — shown as badges in the "sources" variant. |
| `maxVisibleDocuments?` | `number` | Max badges shown before the rest collapse behind a clickable "+N more" pill. Default 4. |
| `showConnector?` | `boolean` | Draw the vertical connector line beneath this step's icon, joining it to the next step. Set false on the last step in a panel. Defaults to false so a standalone step renders without a dangling line. |
| `className?` | `string` |  |

### CdlReasoningPanel

| Prop | Type | Description |
|---|---|---|
| `thinkingTime` | `string` | How long the run took, e.g. "4m24s". Rendered as "Thought for 4m24s" — pass the duration alone, not the sentence. |
| `steps?` | `ThinkingStep[]` | The run, oldest first. Every field on a step renders here: the action icon, the description prose, and the document badges — which is the point of the panel. This is the record, so it is unbounded and it scrolls with the page. Every step gets a marker in the icon lane whether or not it sets `iconKind`: declare one and it says what kind of work happened, omit it and the step gets a neutral dot. The lane is never blank, and the fallback never claims work the caller did not. Omit it, or pass an empty array, and the row becomes plain text with no chevron. A disclosure control that opens onto nothing is worse than no control. |
| `defaultOpen?` | `boolean` | Start expanded. Defaults to false — the record is reference material, so it stays out of the way until the reader asks for it. |
| `onOpenChange?` | `(open: boolean) => void` | Called with the new state whenever the reader opens or closes the panel. Worth wiring in a scrolling thread: expanding the panel changes the message's height, and the list may need to leave its scroll position alone rather than follow it. |
| `className?` | `string` |  |

### CdlMessageBubble

| Prop | Type | Description |
|---|---|---|
| `message` | `ChatMessage` |  |
| `children?` | `React.ReactNode` | Rich content (tables, charts, artifacts) rendered between an assistant message's text and its action row. Ignored for user messages. |
| `onCopy?` | `() => void` |  |
| `onDownload?` | `() => void` |  |
| `onThumbsUp?` | `() => void` |  |
| `onThumbsDown?` | `() => void` |  |
| `onSourcesClick?` | `() => void` |  |
| `showFeedback?` | `boolean` | Show the thumbs-up / thumbs-down feedback buttons in the action row. Default true. |
| `className?` | `string` |  |

### CdlMessageRail

| Prop | Type | Description |
|---|---|---|
| `items` | `CdlMessageRailItem[]` | One tick per item, rendered top-to-bottom in conversation order. |
| `activeId?` | `string \| null` | Id of the item to highlight as the current position. |
| `visibleIds?` | `string[]` | Ids considered on-screen — emphasised, but not highlighted as active. |
| `onJump` | `(id: string) => void` | Called with the item id when its tick is clicked. |
| `className?` | `string` |  |

### CdlMessageList

| Prop | Type | Description |
|---|---|---|
| `messages` | `ChatMessage[]` |  |
| `status?` | `ChatStatus` | Where the conversation is in its reply cycle. Drives the thinking indicator, and scrolling: while `"loading"` or `"streaming"` the list follows the live edge so an arriving reply stays in view. At `"idle"` it stops following, so reader-driven height changes — expanding a reasoning panel, a rich block rendering — push content down where they sit instead of snapping the thread to the bottom. Pass it whenever replies stream in; leaving it at `"idle"` means the list never auto-follows. |
| `thinkingSteps?` | `ThinkingStep[]` | Steps shown in the thinking indicator while loading. |
| `emptyState?` | `React.ReactNode` | Rendered when there are no messages. |
| `onSourcesClick?` | `(message: ChatMessage) => void` | Called when the user clicks the sources group on an assistant message. |
| `renderMessageExtras?` | `(message: ChatMessage) => React.ReactNode` | Rich content (tables, charts, artifacts) rendered inside an assistant message's bubble, between its text and its action row. Called once per message; return `null` for messages that have no extras. |
| `threadKey?` | `string \| number` | Identifies the current conversation. When it changes, the list resets its scroll to the top so a freshly-selected thread reads from its first message. New messages within the same thread still auto-follow to the bottom. Omit for a single always-follow-the-latest stream. |
| `showFeedback?` | `boolean` | Show the thumbs-up / thumbs-down feedback buttons on assistant messages. Default true. |
| `showNavRail?` | `boolean` | Show a hover-reveal navigation rail in the gutter (one tick per user turn) for jumping around long threads. |
| `className?` | `string` |  |

### CdlThinkingIndicator

| Prop | Type | Description |
|---|---|---|
| `steps?` | `ThinkingStep[]` | The steps that have happened so far, oldest first — append as work lands and the rail grows with it. While the rail is live, only the label line renders (`text`, `fileRef`, `suffix`, `duration`). `description` and `documents` are deliberately dropped there: a step whose height depends on its content would break the fixed-height guarantee that keeps the answer from moving. A step's `state` is dropped too — see the component note. Nothing is lost. At `done` the same steps go to `CdlReasoningPanel`, which renders every field — so set them, and they surface in the record. |
| `label?` | `string` | Header text while working. Rendered verbatim, so the ellipsis is yours to include or leave off. Defaults to "Thinking...". |
| `done?` | `boolean` | The reply has landed. The rail gives way to `CdlReasoningPanel`: a single "Thought for 4m24s" row that expands into the whole run on click — unbounded and fully detailed this time, because at rest the reader wants the record, not a window. Do not also render a reasoning panel on the finished message, or the reader gets two "Thought for" rows. Either let this component rest, or unmount it and let the bubble carry the record. |
| `totalDuration?` | `string` | Total to show in the resting row, e.g. "4m24s". Omit and the component uses the time it measured itself, which is usually what you want. |
| `compactAfterMs?` | `number` | How long to wait, in ms, before showing the label. A reply arriving sooner renders no indicator at all. Defaults to 400. |
| `stepsAfterMs?` | `number` | How long to wait, in ms, before steps join the label. Only applies when `steps` is non-empty. Defaults to 1500. Floored at `compactAfterMs`: set this lower and the steps arrive with the label rather than before it, because nothing at all is allowed on screen inside that first window. |
| `maxVisibleSteps?` | `number` | How many steps the rail shows at once. Beyond this it scrolls: new steps arrive at the bottom, older ones scroll up out of view, and the height stops changing so the answer below never gets pushed around. The box is exactly this many rows tall, so all of them read at full strength and the top edge falls between rows. Defaults to 4. |
| `className?` | `string` |  |

### CdlThinkingIndicator

| Prop | Type | Description |
|---|---|---|
| `steps?` | `ThinkingStep[]` | The steps that have happened so far, oldest first — append as work lands and the rail grows with it. While the rail is live, only the label line renders (`text`, `fileRef`, `suffix`, `duration`). `description` and `documents` are deliberately dropped there: a step whose height depends on its content would break the fixed-height guarantee that keeps the answer from moving. A step's `state` is dropped too — see the component note. Nothing is lost. At `done` the same steps go to `CdlReasoningPanel`, which renders every field — so set them, and they surface in the record. |
| `label?` | `string` | Header text while working. Rendered verbatim, so the ellipsis is yours to include or leave off. Defaults to "Thinking...". |
| `done?` | `boolean` | The reply has landed. The rail gives way to `CdlReasoningPanel`: a single "Thought for 4m24s" row that expands into the whole run on click — unbounded and fully detailed this time, because at rest the reader wants the record, not a window. Do not also render a reasoning panel on the finished message, or the reader gets two "Thought for" rows. Either let this component rest, or unmount it and let the bubble carry the record. |
| `totalDuration?` | `string` | Total to show in the resting row, e.g. "4m24s". Omit and the component uses the time it measured itself, which is usually what you want. |
| `compactAfterMs?` | `number` | How long to wait, in ms, before showing the label. A reply arriving sooner renders no indicator at all. Defaults to 400. |
| `stepsAfterMs?` | `number` | How long to wait, in ms, before steps join the label. Only applies when `steps` is non-empty. Defaults to 1500. Floored at `compactAfterMs`: set this lower and the steps arrive with the label rather than before it, because nothing at all is allowed on screen inside that first window. |
| `maxVisibleSteps?` | `number` | How many steps the rail shows at once. Beyond this it scrolls: new steps arrive at the bottom, older ones scroll up out of view, and the height stops changing so the answer below never gets pushed around. The box is exactly this many rows tall, so all of them read at full strength and the top edge falls between rows. Defaults to 4. |
| `className?` | `string` |  |

### CdlThinkingIndicatorLegacy

| Prop | Type | Description |
|---|---|---|
| `steps?` | `ThinkingStep[]` | The steps that have happened so far, oldest first — append to this array as work lands and the rail grows with it. Each step's `state` is honoured if set; otherwise the last step is treated as running and the rest as done. Only the label line of each step renders here (`text`, `fileRef`, `suffix`, `duration`). `description` and `documents` are deliberately ignored: a step whose height depends on its content would break the fixed-height guarantee that keeps the answer from moving. They surface in the reasoning panel on the finished message instead, via CdlReasoningStep. |
| `label?` | `string` | Word shown while waiting, before any steps appear. Keep it to one word or two — it is a state, not a sentence. Defaults to "Thinking". |
| `compactAfterMs?` | `number` | How long to wait, in ms, before showing the label. A reply that arrives sooner renders no indicator. Defaults to 400. |
| `stepsAfterMs?` | `number` | How long to wait, in ms, before the label gives way to the steps. Only applies when `steps` is non-empty. Defaults to 1500. |
| `maxVisibleSteps?` | `number` | How many steps the rail is tall. Once there are more, it becomes a scroll box fixed at this height: new steps arrive at the bottom and older ones scroll up out of view behind a fade. Nothing is discarded — the reader can scroll back through the entire run — and the height stops changing, so the answer below never gets pushed around. Defaults to 4. |
| `showElapsed?` | `boolean` | Show the elapsed-time counter beside the label. Defaults to true. |
| `collapsible?` | `boolean` | Let the reader fold the whole rail away mid-run, leaving just the label and the counter. Worth keeping on for long agent runs. Defaults to true. |

### CdlInputBarButton

| Prop | Type | Description |
|---|---|---|
| `label` | `string` |  |
| `icon?` | `ReactNode` |  |
| `items` | `CdlInputBarButtonItem[]` |  |

### CdlInputBar

| Prop | Type | Description |
|---|---|---|
| `onSubmit` | `(query: string, attachments?: string[]) => void` |  |
| `disabled?` | `boolean` |  |
| `placeholder?` | `string` |  |
| `className?` | `string` |  |
| `children?` | `ReactNode` | Toolbar buttons rendered in the gray strip below the input card (left side). |
| `rightChildren?` | `ReactNode` | Toolbar buttons rendered in the gray strip below the input card (right side). |
| `slashCommands?` | `CdlSlashCommand[]` | Skills that can be applied to a prompt by typing "/". Typing a "/" at the start of the message or after a space opens a filterable menu; picking one inserts "/<label> " inline at the caret. Every valid "/command" token is highlighted as real, edited text (not an overlay), so commands can sit anywhere in the message. |

### CdlChatPanel

| Prop | Type | Description |
|---|---|---|
| `title?` | `string` | Chat title shown in the header. |
| `messages` | `ChatMessage[]` |  |
| `status?` | `ChatStatus` |  |
| `onSubmit` | `(query: string, attachments?: string[]) => void` |  |
| `thinkingSteps?` | `ThinkingStep[]` | Steps shown in the thinking indicator while the AI is loading. |
| `emptyState?` | `React.ReactNode` | Rendered in the message area when there are no messages. |
| `placeholder?` | `string` | Placeholder text for the input field. |
| `headerActions?` | `React.ReactNode` | Extra content rendered in the header, after the title (e.g. a close button). |
| `inputBarChildren?` | `React.ReactNode` | Toolbar buttons rendered in the gray strip below the input (left side). |
| `inputBarRightChildren?` | `React.ReactNode` | Toolbar buttons rendered in the gray strip below the input (right side). |
| `slashCommands?` | `CdlSlashCommand[]` | Skills surfaced in the input's "/" command menu. |
| `showNavRail?` | `boolean` | Show a hover-reveal navigation rail in the gutter for jumping around long threads. |
| `showFeedback?` | `boolean` | Show the thumbs-up / thumbs-down buttons on each assistant message. Default true. Turn it off where per-answer feedback isn't collected — the copy, download and sources controls stay. |
| `renderMessageExtras?` | `(message: ChatMessage) => React.ReactNode` | Rich content (tables, charts, approval cards) rendered inside an assistant message's bubble, between its text and its action row. Called once per message; return `null` for messages that have no extras. |
| `threadKey?` | `string \| number` | Identifies the current conversation. When it changes, the message list resets its scroll to the top so a freshly-selected thread reads from its first message. Omit for a single always-follow-the-latest stream. |
| `sourcesLayout?` | `"side" \| "overlay"` | Where the Sources panel opens. `"side"` (default) docks it beside the chat at a fixed width — right for a full-page chat. `"overlay"` lays it over the messages and input, below the header, and leaves the chat at full width underneath — use it when the chat itself is narrow (a sheet or a rail), where a side panel would leave the messages too narrow to read. |
| `className?` | `string` |  |

### CdlChatSidebar

| Prop | Type | Description |
|---|---|---|
| `sessions` | `CdlChatSession[]` | Chat sessions to list, in display order (newest first is conventional). |
| `activeId?` | `string` | Id of the currently open session; highlights its row. |
| `onSelect?` | `(id: string) => void` | Called with a session id when the user clicks a chat. |
| `onNewChat?` | `() => void` | Called when the user clicks the "New chat" button. |
| `links?` | `CdlChatNavLink[]` | Secondary nav links shown in a separate section pinned below the chat history (e.g. Document Library, Data Connections). |
| `activeLinkId?` | `string` | Id of the active link; highlights its row. |
| `onLinkSelect?` | `(id: string) => void` | Called with a link id when the user clicks a nav link. |
| `defaultCollapsed?` | `boolean` | Start collapsed (icon-only) instead of expanded. Defaults to `false`. |
| `defaultMode?` | `"docked" \| "floating"` | Start floating (overlay card) or docked (in-layout rail). Defaults to `"docked"`. |
| `className?` | `string` | Extra classes merged onto the sidebar's root element. |

### CdlChatSessionList

| Prop | Type | Description |
|---|---|---|
| `sessions` | `CdlChatSession[]` | Chat sessions to list, in display order (newest first is conventional). |
| `activeId?` | `string` | Id of the currently open session; highlights its row. |
| `onSelect?` | `(id: string) => void` | Called with a session id when the user clicks a chat. |
| `onNewChat?` | `() => void` | Called when the user clicks the "New chat" button. Omit to hide the button. |
| `onRename?` | `(id: string, title: string) => void` | Called with `(id, newTitle)` when the user finishes an inline rename. Omit to hide the Rename action from each row's menu. |
| `onDelete?` | `(id: string) => void` | Called with a session id when the user deletes it. Omit to hide the Delete action. |
| `showSearch?` | `boolean` | Show the search field above the list. Defaults to `true`. |
| `visibleCount?` | `number` | Show only the first N chats, with a "See more" row that reveals the rest (and "See less" to fold them again). A search, or an active chat past the cut-off, shows the full list. Omit to always show every chat. |
| `className?` | `string` | Extra classes merged onto the list's root element. |

### CdlBlockGroup

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |
| `variant?` | `BlockVariant` | Visual style of the block. "default" draws a rounded border around the whole group; "flush" drops the outer border but keeps one around the content area; "plain" draws no borders at all — the content sits directly on the page surface (pair with CdlDataTable's "plain" variant for a borderless list). |

### CdlBlockHeader

| Prop | Type | Description |
|---|---|---|
| `title?` | `string` | Header title. Ignored when `breadcrumbs` is provided. |
| `breadcrumbs?` | `CdlBlockHeaderCrumb[]` | Breadcrumb trail rendered in place of the title, for headers that double as path navigation (e.g. a file browser). Segments with an `onClick` render as muted, clickable links; the last segment is styled like the title since it is the current location. A single-segment trail looks identical to `title`. |
| `leading?` | `React.ReactNode` | Leading slot rendered before the title/breadcrumbs, e.g. a back button in a file browser. Kept inline with the path so it aligns with the trail. |
| `info?` | `React.ReactNode` | Short contextual help revealed on hover via an info icon after the title (e.g. what a chart's series mean, or a table's filter criteria). Ignored when `breadcrumbs` is provided. |
| `description?` | `React.ReactNode` | A line of supporting copy under the title — what the block shows, in plain language (e.g. how to read a chart). Always visible, unlike `info`; pair the two when there's both a summary and detail worth keeping out of the content area. The header grows to fit it. Ignored when `breadcrumbs` is provided. |
| `actions?` | `React.ReactNode` | Right-aligned action slot. |

### CdlBlockContent

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |
| `inset?` | `boolean` | Inset the content from the block's edges, aligning its left edge with the header title. Use it for anything that is not a table: a definition list, a form, a paragraph, a grid of cards. It is opt-in rather than the default because the common case is a CdlDataTable, which carries its own cell padding and has to meet the block's border — padding it would leave a gap the table's own row dividers stop short of. Everything else needs this, so reach for it instead of hand-rolling a padding class: the value is the header's, so the two line up. |

### CdlBlockFooter

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` | Class names merged after the defaults. Use to override the footer's layout per-instance, e.g. `"justify-start"` to left-align a caption (content is right-aligned by default). |

### CdlContentHeading

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `subheading?` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlFooterBar

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` | The actions, right-aligned — typically one or two `Button`s. The last child is the primary action. |
| `message?` | `React.ReactNode` | Status text shown just left of the actions. Use it to say what is left to do or why an action is unavailable, e.g. "4 of 6 answers still to review". |
| `className?` | `string` | Extra classes on the bar root. |

### CdlPageHeader

| Prop | Type | Description |
|---|---|---|
| `title` | `string` |  |
| `titleMenu?` | `CdlPageHeaderTitleMenu` | Turns the title into a dropdown that switches between sibling records (e.g. "Oct 2026 ⌄" to pick another period). It looks like the plain title plus a chevron: no border, box or fill. `title` stays the accessible h1 (visually hidden) and the final breadcrumb crumb. |
| `titleIcon?` | `React.ReactNode` | Small adornment rendered immediately before the title text — e.g. a partner logo or product avatar. Keep it compact (roughly the cap height of the title); it is decorative, so mark any `img` you pass `aria-hidden`. |
| `titleBadge?` | `React.ReactNode` | Small status chip rendered immediately after the title text — e.g. a `Badge` reading "Draft", "Archived" or "Beta". Use it for the *state of the thing the page is about*, not for actions or counts; keep it to one or two words so it doesn't compete with the title. It never shrinks, so a long title truncates before the chip does. |
| `titleInfo?` | `React.ReactNode` | When provided, an info icon is rendered immediately after the title; hovering (or focusing) it reveals this content in a tooltip. Use it for short contextual help about the page — what the screen is for, a data caveat — that would otherwise clutter the body. Keep it to a sentence or two. |
| `description?` | `React.ReactNode` | One-line subheader rendered as visible muted text directly under the title. Use it for a short standing description of the page — a scope note or a rule every visitor should read. Unlike `titleInfo` (hidden behind an info tooltip), it is always visible; keep it to a sentence or two. |
| `onBack?` | `() => void` | When provided, a leading back button (a left-arrow) is rendered to the left of the breadcrumb/title block and calls this on click. Use it on detail pages to return to the list/parent screen. |
| `backLabel?` | `string` | Accessible label for the back button. Defaults to "Go back". |
| `segments?` | `Array<string \| CdlBreadcrumbSegment>` | Breadcrumb trail shown above the title. The page `title` is appended automatically as the current (final) crumb — do not repeat it here. Pass a plain string for a static segment, or `{ label, onClick }` to make it clickable and navigate. |
| `actions?` | `React.ReactNode` |  |

### CdlDetailPanel

| Prop | Type | Description |
|---|---|---|
| `title?` | `string` | Title shown in the panel header. Defaults to "Details". |
| `titleIcon?` | `React.ReactNode` | Small adornment rendered immediately before the title — e.g. an icon naming the *kind* of thing the panel describes (a table, a file, a person). Keep it roughly the cap height of the title; it is decorative, so mark any `img` you pass `aria-hidden`. It never shrinks, so a long title truncates before it does. |
| `tabs?` | `CdlDetailPanelTab[]` | Tabs to display in the body. When omitted (or empty), the body renders `children` in a single scrollable area instead of a tab bar. Provide either `tabs` or `children`, not both. |
| `children?` | `React.ReactNode` | Body content used when `tabs` is not provided. Rendered in a scroll area. |
| `footer?` | `React.ReactNode` | Optional footer, pinned to the bottom, right-aligned (e.g. action buttons). Shown on every tab; for a footer scoped to a single tab, set `footer` on that tab instead (a tab's own footer wins over this one while it's active). |
| `onClose?` | `() => void` | Called when the user clicks the close button. Not required when `hideClose` is set. |
| `hideClose?` | `boolean` | Hides the header's collapse/close button, turning the panel into a permanent rail that can't be dismissed. Use for a detail panel that is always open by design (e.g. a record-detail side rail). When set, `onClose` is optional. |
| `defaultTab?` | `string` | Id of the initially active tab. Defaults to the first tab's id. |
| `resetKey?` | `string \| number` | Identity of the panel's current subject (e.g. a document id). When it changes, the panel returns to its default tab and scrolls its body back to the top — so opening a different item never inherits the previous one's tab or scroll position. Leave unset if the panel always shows the same subject. |
| `open?` | `boolean` | Controls the enter/exit animation. Keep the component mounted and toggle this to animate the panel in and out; the panel stays mounted through its exit transition, then collapses its layout space. Omit (defaults to `true`) for the legacy pattern where a parent conditionally mounts the panel — it still animates in on mount, but cannot animate out (the parent unmounts it). |
| `animate?` | `boolean` | Whether the panel slides/fades in and out. Defaults to `true`. Set to `false` to make it appear and disappear instantly (no travel, no fade) — useful when the panel is always present and its motion would be a distraction. Users with a reduced-motion preference already get a travel-free cross-fade regardless. |
| `className?` | `string` |  |
| `style?` | `React.CSSProperties` |  |

### CdlTree

| Prop | Type | Description |
|---|---|---|
| `nodes` | `CdlTreeNode[]` | The tree data — top-level nodes, each of which may nest via `children`. |
| `selectedId?` | `string` | Currently selected node id (controlled). Pass together with `onSelect` to drive selection from the parent; omit to let the tree manage it internally. |
| `defaultSelectedId?` | `string` | Initial selected node id when the tree manages selection itself (uncontrolled). |
| `onSelect?` | `(id: string, node: CdlTreeNode) => void` | Called with the node id and the node when a row is clicked. |
| `multiSelect?` | `boolean` | Enable multi-selection. Shift+click selects the visible range between the last plainly-clicked row and the clicked row; Cmd/Ctrl+click toggles a row in or out. A plain click collapses the selection to that single row (and still fires `onSelect`). With `onMove`, dragging any selected row drags the whole selection. |
| `selectedIds?` | `string[]` | The multi-selection as an array of node ids (controlled; `multiSelect` only). Pass together with `onSelectionChange` to own the selection from the parent; omit to let the tree manage it internally. |
| `onSelectionChange?` | `(ids: string[], nodes: CdlTreeNode[]) => void` | Called whenever the multi-selection changes (`multiSelect` only), with all selected ids and their nodes. |
| `onMove?` | `(ids: string[], targetId: string, nodes: CdlTreeNode[]) => void` | Called when the user drags one or more rows and drops them onto a folder, with the dragged ids, the target folder id, and the dragged nodes. Providing this makes every row draggable and every folder a drop target. Drops land *into* folders only — the tree never reorders siblings, so ordering stays governed by `sort`. Structurally invalid drops (a folder into itself or its own descendant, or into the rows' current parent) are blocked before this fires. The tree does not restructure its own data — update your `nodes` in this handler. Hovering a collapsed folder mid-drag expands it after a short delay. |
| `canDrop?` | `(ids: string[], targetId: string) => boolean` | Optional veto over drop targets, called while dragging with the dragged ids and a candidate folder id. Return false to mark that folder invalid (no highlight, drop disabled) — e.g. a derived or read-only folder. Structural rules (self, descendant, current parent) are enforced regardless. |
| `onRenameFolder?` | `(id: string, newLabel: string, node: CdlTreeNode) => void` | Called when a folder is renamed via its row menu, with the folder id, the new label, and the node. Providing this adds a "Rename" item to the hover-revealed "⋯" menu on every folder (branch) row, and turns the folder label into an inline text field while editing. Omit to hide the Rename action. |
| `onDeleteFolder?` | `(id: string, node: CdlTreeNode) => void` | Called when a folder's "Delete" menu item is chosen, with the folder id and the node. Providing this adds a destructive "Delete" item to the hover-revealed "⋯" menu on every folder (branch) row. The tree does not remove the node itself — update your `nodes` data in this handler. Omit to hide the Delete action. |
| `onAddFolder?` | `(parentId: string, newLabel: string, parentNode: CdlTreeNode) => void` | Called when "Add folder" is chosen on a folder's row menu, with the parent folder id, the typed name, and the parent node. Providing this adds an "Add folder" item to the "⋯" menu; choosing it drops an inline draft row inside the (auto-expanded) folder, committing the name on Enter or blur. The tree does not insert the node itself — add a child to your `nodes` data here. |
| `onAddFile?` | `(parentId: string, newLabel: string, parentNode: CdlTreeNode) => void` | Called when "Add file" is chosen on a folder's row menu, with the parent folder id, the typed name, and the parent node. Providing this adds an "Add file" item to the "⋯" menu; choosing it drops an inline draft row inside the (auto-expanded) folder, committing the name on Enter or blur. The tree does not insert the node itself — add a child leaf to your `nodes` data here. |
| `defaultExpandedIds?` | `string[] \| true` | Ids of branches that start expanded (uncontrolled). Pass `true` to expand every branch on first render. Defaults to all collapsed. |
| `hideCount?` | `boolean` | Hide the trailing count (e.g. the number of documents in a folder) on the right of each row. Defaults to showing any `count` set on a node. |
| `sort?` | `"alpha" \| "none"` | How sibling nodes are ordered at every level. - `"alpha"` (default): folders first, then files, each group sorted case-insensitively by label — the predictable file-browser ordering. - `"none"`: render nodes in exactly the order they are passed, for cases where the sequence is meaningful (e.g. steps or a curated list). |
| `className?` | `string` |  |
| `style?` | `React.CSSProperties` |  |

### CdlPreviewPane

| Prop | Type | Description |
|---|---|---|
| `icon?` | `React.ReactNode` | Leading glyph shown in the header — typically a file-type icon. Pass a sized node (e.g. `<FileText className="size-5" />`); it renders muted inside a rounded tile. Omit for a title-only header. |
| `title?` | `string` | Title shown in the header — usually the document's name. |
| `meta?` | `React.ReactNode` | Metadata row rendered under the title — badges, owner, size, dates, etc. Laid out as a wrapping, muted, small-text flex row; compose it freely. |
| `children?` | `React.ReactNode` | The preview body — the rendered document (or a faux placeholder). |
| `emptyState?` | `React.ReactNode` | Shown centred when there is nothing to preview. Pair with `CdlEmptyState`. Rendered whenever the pane is empty (see `isEmpty`). |
| `isEmpty?` | `boolean` | Force the empty state on or off. When omitted, the pane is considered empty if it has neither a `title` nor `children` — so selecting a folder (title cleared) naturally falls back to `emptyState`. |
| `framed?` | `boolean` | Wrap the body in a centred "page" surface (bordered white sheet on a neutral backdrop), like a real document viewer. Set `false` to place `children` directly on the backdrop — e.g. for a full-bleed image or custom viewer. Defaults to `true`. |
| `contentClassName?` | `string` | Extra classes on the body wrapper — e.g. `max-w-[960px]` to widen the sheet. |
| `className?` | `string` | Extra classes on the outer pane container. |

### CdlDrawer

| Prop | Type | Description |
|---|---|---|
| `open` | `boolean` | Whether the drawer is open. Controlled — pair with `onOpenChange`. |
| `onOpenChange` | `(open: boolean) => void` | Called with `false` when the user dismisses the drawer (close button, overlay click, Escape). |
| `header?` | `React.ReactNode` | Header row content, doubling as the drawer's accessible title (it renders inside the dialog's `Title`, which labels the dialog for screen readers). Provide it whenever possible; without it, a visually hidden "Drawer" fallback keeps the dialog labelled. |
| `footer?` | `React.ReactNode` | Pinned below the scrollable body, e.g. an action row. The drawer supplies the inset, so pass the row itself — do not wrap it in a padded container. |
| `footerClassName?` | `string` | Class names merged onto the footer slot, after its defaults — e.g. `"p-3"` to tighten the built-in inset. |
| `children?` | `React.ReactNode` | Scrollable body content. The drawer supplies the inset, so pass the content itself — do not wrap it in a padded container. Set `flushBody` when the content must run edge to edge. |
| `width?` | `"sm" \| "md" \| "lg" \| "xl" \| "2xl"` | Panel width: 384px, 480px (default), 576px, 768px, or 960px. Reach past `lg` only for a drawer that holds a working table — a worksheet the reader edits column by column. A drawer this wide covers most of the page, so a detail list never needs one. |
| `flushBody?` | `boolean` | Set to `true` to drop the body inset so the content runs edge to edge. Use it for a table, or for stacked sections that carry their own dividers and padding. The footer keeps its inset either way. |
| `bodyScroll?` | `boolean` | Set to `false` when the content manages its own scrolling — a full-height table, or a tab set with `fill`. The body then bounds the content to the panel's height instead of wrapping it in a scroll area, so the overflow happens inside the content and its own sticky header stays put. Defaults to `true`, which scrolls the whole body. |

### CdlAppSidebarGroup

| Prop | Type | Description |
|---|---|---|
| `group` | `CdlSidebarNavGroup` | The group to render, same shape as a `navGroups` entry. |

### CdlAppSidebar

| Prop | Type | Description |
|---|---|---|
| `appName?` | `string` |  |
| `appDescription?` | `string` |  |
| `logo?` | `React.ReactNode` | Brand element (e.g. a logo) shown in the expanded sidebar header in place of the default badge + app name. |
| `navGroups?` | `CdlSidebarNavGroup[]` |  |
| `pinnedNavGroups?` | `CdlSidebarNavGroup[]` | Nav groups always shown at the bottom of the sidebar, separated from the main nav. Use to pin global navigation in product demos that have their own navGroups. |
| `userEmail?` | `string` |  |
| `userInitials?` | `string` |  |
| `children?` | `React.ReactNode` | Replaces the nav groups. Compose `CdlAppSidebarGroup`s and `CdlAppSidebarSeparator`s, or pass any layout. |
| `footerNavItems?` | `CdlSidebarNavItem[]` | Nav links rendered in the sidebar footer, directly above the Settings row — same group, always visible. Use for a small set of global destinations (e.g. a document library) that should sit with Settings rather than scroll with the main nav. |
| `footerContent?` | `React.ReactNode` | Free-form content pinned to the top of the footer, directly above `footerNavItems` and the Settings row — always visible, not scrolled with the main nav. Use for a small global note or bespoke control (e.g. a demo disclaimer). Hidden in the sidebar's icon-collapsed mode, where free-form content can't shrink to an icon. |
| `settingsMenu?` | `React.ReactNode` | Replaces the Settings dropdown items (default: placeholders with no actions). `null` removes the Settings row. |
| `footer?` | `React.ReactNode` | Replaces the user row in the footer. |
| `userMenu?` | `React.ReactNode` | Replaces the contents of the dropdown that opens from the user row at the bottom of the sidebar (default: Account settings + Log out). Pass menu items — e.g. a persona switcher in a demo, or a workspace list. The row gains a caret to show that the identity itself can change. |

### CdlTabs

| Prop | Type | Description |
|---|---|---|
| `items` | `CdlTabItem[]` | The tabs to render, in display order. |
| `variant?` | `CdlTabsVariant` | Which bar to render. "default" is the plain strip; "process" numbers the steps and joins them with connectors; "gated" marks unfinished tabs with a dashed ring and locks the final tab. Defaults to "default". |
| `defaultTab?` | `string` | Initial active tab label for uncontrolled mode. Defaults to the first tab. |
| `activeTab?` | `string` | Active tab label for controlled mode. When provided, the parent owns active state and must update it in `onTabChange`. |
| `onTabChange?` | `(label: string) => void` | Called with the new tab label when the user selects a tab. |
| `children?` | `React.ReactNode` | Shared content shown under the bar when no item defines its own `content` (e.g. the parent swaps content in response to `onTabChange`). |
| `header?` | `React.ReactNode` | Node pinned above the tab bar inside the same non-scrolling header block (e.g. a page header). |
| `fill?` | `boolean` | Fill the parent's height: pins the bar and makes the content area scroll. Requires a height-bounded **flex column** parent (e.g. `flex flex-col h-[480px]`) — in a plain block the tabs grow past it instead of scrolling inside it. Defaults to false (tabs grow with their content). |
| `overflow?` | `"auto" \| "hidden"` | When `fill`, controls content overflow. Use "hidden" for full-height children that scroll themselves (e.g. chat panels). Defaults to "auto". |
| `contentAs?` | `React.ElementType` | Element type for the scrollable content region. Defaults to "div". |
| `contentRef?` | `React.Ref<HTMLElement>` | Ref to the content region element (e.g. for measuring or animating its width). |
| `className?` | `string` | Extra classes for the Tabs root. |
| `barClassName?` | `string` | Extra classes for the tab bar (TabsList). |
| `contentClassName?` | `string` | Extra classes for the content region. |

### CdlPageContainer

| Prop | Type | Description |
|---|---|---|
| `children?` | `React.ReactNode` |  |
| `title?` | `string` |  |
| `titleIcon?` | `React.ReactNode` | Small adornment (e.g. a partner logo) rendered before the title text. Forwarded to CdlPageHeader. |
| `titleBadge?` | `React.ReactNode` | Small status chip (e.g. a "Draft" Badge) rendered after the title text. Forwarded to CdlPageHeader. |
| `titleInfo?` | `React.ReactNode` | Short contextual help revealed on hover via an info icon after the title. Forwarded to CdlPageHeader. |
| `description?` | `React.ReactNode` | One-line subheader rendered as visible muted text under the title. Forwarded to CdlPageHeader. |
| `onBack?` | `() => void` | When set, renders a leading back button in the header that calls this on click. Forwarded to CdlPageHeader. |
| `backLabel?` | `string` | Accessible label for the header back button. Defaults to "Go back". |
| `segments?` | `Array<string \| CdlBreadcrumbSegment>` | Breadcrumb trail above the title. The `title` is appended automatically as the current crumb — do not repeat it. Plain strings render as static text; `{ label, onClick }` segments are clickable and navigate. |
| `actions?` | `React.ReactNode` |  |
| `navLinks?` | `CdlNavLink[]` |  |
| `navVariant?` | `CdlTabsVariant` | Which tab bar the nav links render as. "default" is the plain strip; "process" numbers the steps and joins them with connectors; "gated" marks unfinished tabs with a dashed ring and locks the final `gate` tab until every other tab reports `done`. In "gated", a link can also carry `locked` (with an optional `lockedReason`) to hold a middle step shut until the steps before it sign off. Defaults to "default". Forwarded to CdlTabs. |
| `defaultTab?` | `string` | Initial active tab label for uncontrolled mode. Defaults to the first tab. |
| `activeTab?` | `string` | Active tab label for controlled mode. When provided, the parent owns active state. |
| `onTabChange?` | `(label: string) => void` | Called when the user clicks a tab. In controlled mode, the parent must update activeTab in response. |
| `overflow?` | `"auto" \| "hidden"` | Controls main content overflow. Use "hidden" for full-height children that handle their own scrolling (e.g. chat panels). Defaults to "auto", which scrolls vertically and reserves the scrollbar's width (`scrollbar-gutter: stable`), so the content does not shift when a scrollbar appears. |
| `contentClassName?` | `string` | Extra classes applied to the main content area. |
| `footer?` | `React.ReactNode` | A bar pinned flush to the bottom of the content area, below the scroll region and above the page edge. Use it for the action that commits the whole page — signing a period off, submitting a plan — so the button stays in view however far the reader has scrolled. Actions that belong to one table stay on that block's own header instead. |
| `sidebar?` | `CdlAppSidebarProps` | Props forwarded to CdlAppSidebar (app name, nav groups, user info). |
| `sidebarContent?` | `React.ReactNode` | Custom content rendered in the sidebar body, replacing navGroups. |
| `sidebarFooter?` | `React.ReactNode` | Custom content rendered in the sidebar footer, replacing the user row. |
| `hideSidebar?` | `boolean` | Hides the app sidebar entirely, rendering the page content full-width. |
| `theme?` | `CdlTheme` | Applies a brand theme by setting data-theme on <html> for this page. |
| `colorMode?` | `"light" \| "dark"` | Forces light or dark mode for this page, overriding the user's stored preference. |

### CdlLoginCard

| Prop | Type | Description |
|---|---|---|
| `title?` | `string` |  |
| `description?` | `string` |  |
| `onSubmit` | `(credentials: CdlLoginCredentials) => Promise<{ error?: string } \| …` |  |
| `onForgotPassword?` | `() => void` |  |
| `onSignUp?` | `() => void` |  |
| `oauthProviders?` | `CdlOAuthProvider[]` |  |
| `onOAuthLogin?` | `(providerId: string) => void` |  |
| `className?` | `string` |  |

### CdlLoginPage

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` |  |
| `className?` | `string` |  |

### CdlDataTableDiff

| Prop | Type | Description |
|---|---|---|
| `sourceData` | `TData[]` | Source (before) data array. |
| `targetData` | `TData[]` | Target (after) data array. |
| `columns` | `ColumnDef<TData>[]` | TanStack column definitions — shared across both tables. |
| `primaryKey` | `keyof TData` | The field used to match rows across source and target. |
| `sourceLabel?` | `string` | Label shown above the source table. |
| `targetLabel?` | `string` | Label shown above the target table. |


### Step 5: Report

After writing the file, output:
- The completed mapping table with ✅ / 🚩 for every requirement
- File path written
- Any deferred items that still need follow-up

---

## Requirement → Component Mapping

Use this table as the first stop when mapping a UI requirement to a component. Read the last column before you pick: it names the near neighbours and when each one is the better choice.

> **Generated.** `npm run build:registry` writes this table from each registry entry's `useFor` and `useInstead` in `scripts/build-registry.mjs`. Do not edit the rows here; edit the entry there. The served copy (`https://cdl-registry.compassdata.workers.dev/cdl-skill.md`, built from `public/cdl-skill.md`) carries the same table.

<!-- CDL_MAPPING:start -->

**Layout**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| A bordered panel with a header, scrolling content and a footer: the standard container for a table, a chart or a form on a page. Its parts are CdlBlockHeader, CdlBlockContent and CdlBlockFooter. | `CdlBlockGroup` (`cdl-block-group`) | Not when you need a small card with a title and an optional footer, not a block of the page → `CdlCard`<br>Not when you need only a title above content, with no border → `CdlContentHeading` |
| A heading for a section of a page, with an optional subheading. | `CdlContentHeading` (`cdl-content-heading`) | Not when the heading needs an actions slot, or belongs to a bordered block → `CdlBlockHeader` (inside `CdlBlockGroup`)<br>Not when the heading is for the whole page and needs breadcrumbs → `CdlPageHeader` |
| Page-level actions pinned to the bottom edge of the content area, such as Send or Save, with an optional status message. | `CdlFooterBar` (`cdl-footer-bar`) | Not when the actions are for the rows the user selected and float over the page → `CdlActionBar`<br>Not when the actions belong to one block, not to the page → `CdlBlockFooter` (inside `CdlBlockGroup`) |
| A breadcrumb header for a page, with a title, an optional back button, a title icon, a dropdown to switch between sibling records, an info tooltip and an actions slot. | `CdlPageHeader` (`cdl-page-header`) | Not when you want the whole page shell, not only the header → `CdlPageContainer`<br>Not when you are heading a block or a section of content, with actions → `CdlBlockHeader` (inside `CdlBlockGroup`)<br>Not when you are heading a section of text and need only a subheading → `CdlContentHeading` |
| Contextual details with tabs that slide in beside the main content, so the user does not leave the page or lose sight of it. | `CdlDetailPanel` (`cdl-detail-panel`) | Not when the panel should cover part of the page and close when the user clicks away → `CdlDrawer`<br>Not when the user must confirm or answer before going on → `CdlDialog`<br>Not when the preview stays open beside a list all the time → `CdlPreviewPane` |
| A file or folder tree to navigate documents or categories, shown as a rail beside a table or a pane. | `CdlTree` (`cdl-tree`) | Not when you need the pane that shows the item the user picked → `CdlPreviewPane`<br>Not when the items are the navigation of the whole app → `CdlAppSidebar` |
| A pane that always shows the document or record the user picked in a list or tree beside it, with a header, a framed body and an empty state. | `CdlPreviewPane` (`cdl-preview-pane`) | Not when the panel opens only when the user asks for it → `CdlDrawer`<br>Not when the panel has tabs and slides in beside the content → `CdlDetailPanel`<br>Not when you need the tree that picks the document → `CdlTree` |
| Details or an edit form for one record, opened from a table row, while the page stays visible behind it. | `CdlDrawer` (`cdl-drawer`) | Not when the user must confirm or answer before going on → `CdlDialog`<br>Not when the preview stays open beside a list all the time → `CdlPreviewPane`<br>Not when the panel has tabs and sits beside the content without covering it → `CdlDetailPanel`<br>Not when the record needs its own URL or a full page → a route with `CdlPageContainer` |
| The navigation sidebar of an app: nav groups, collapsible sections, a user menu and a colour-mode toggle. You rarely mount it yourself; pass `sidebar` to the page container. | `CdlAppSidebar` (`cdl-app-sidebar`) | Not when you are building a normal page → `CdlPageContainer` (pass the sidebar config to it)<br>Not when you need a list of chat sessions inside the sidebar → `CdlChatSessionList` |
| Underlined tabs with their own content panels, outside the page shell, for tabbed sections inside a card or a drawer. `variant="process"` gives numbered steps with checkmarks for an ordered process; `variant="gated"` gives steps done in any order behind a locked last step. | `CdlTabs` (`cdl-tabs`) | Not when the tabs switch the whole page → `CdlPageContainer` (the navLinks prop)<br>Not when you need a segmented or pill switch, not underlined tabs → the Tabs primitive in ui/tabs |
| A full app page: sidebar, breadcrumb header, optional tab bar and a content area. It is the outermost wrapper of every app page. | `CdlPageContainer` (`cdl-page-container`) | Not when you need tabs inside a card or a drawer, not for the whole page → `CdlTabs`<br>Not when you need only the breadcrumb header → `CdlPageHeader` |

**Display**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| A loading placeholder shaped like the real content: a line, a circle or a rectangle. | `CdlSkeleton` (`cdl-skeleton`) | Not when a CDL data component already has a loading state → the loading prop of that component |
| A simple card with a title and an optional footer. | `CdlCard` (`cdl-card`) | Not when the card holds a table, a chart or a form and fills a region of the page → `CdlBlockGroup`<br>Not when the card shows one headline number → `CdlKpiCard` |
| A filled chip that labels the category of a record. | `CdlBadge` (`cdl-badge`) | Not when the label is a status in a table cell or detail row and colour should be rare → `CdlStatusLabel`<br>Not when the user adds or removes the chip → `CdlTag` |
| A quiet status in a table cell or a detail row: an icon and a word, with colour only for what needs attention. | `CdlStatusLabel` (`cdl-status-label`) | Not when you need a filled chip that categorises a record → `CdlBadge`<br>Not when the user adds or removes the label → `CdlTag`<br>Not when the status applies to the whole page → `CdlBanner` |
| A chip the user can remove, such as an applied filter or a chosen recipient. | `CdlTag` (`cdl-tag`) | Not when the chip only labels a record → `CdlBadge`<br>Not when the label is a status in a table cell → `CdlStatusLabel` |
| A centred message with an icon, a title and an action, for a region that has nothing to show yet. | `CdlEmptyState` (`cdl-empty-state`) | Not when the page still shows content but the data is stale or a service is degraded → `CdlBanner`<br>Not when you are reporting the result of an action → `CdlSonner`<br>Not when a table has no rows → the emptyState prop of `CdlDataTable` |
| A horizontal bar for progress or a proportion, with an optional target marker. | `CdlProgress` (`cdl-progress`) | Not when you need one value against a scale, drawn as a gauge → `CdlRadialGauge`<br>Not when the bar belongs with a headline number and a trend → `CdlKpiCard` |
| A headline number with a trend indicator and an optional progress bar. | `CdlKpiCard` (`cdl-kpi-card`) | Not when you need only a bar → `CdlProgress`<br>Not when you need one value against a scale, drawn as a gauge → `CdlRadialGauge`<br>Not when the card holds anything other than one metric → `CdlCard` |

**Data**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| Editable label and value rows for the fields of one record, with keyboard navigation. | `CdlDataForm` (`cdl-data-form`) | Not when you edit many records as rows → `CdlDataTable` (editable columns) |
| A simple sortable table for a short read-only list. | `CdlTable` (`cdl-table`) | Not when users need filters, search, selection or editing → `CdlDataTable` |
| The filter panel of a data table: condition filters (field, operator and values, joined with and/or). CdlDataTable already includes it; install it alone only to build a custom filter bar. | `CdlDataTableFilter` (`cdl-data-table-filter`) | Not when you need a table with a filter bar → `CdlDataTable` (the filterFields prop) |
| A searchable dropdown to pick one value or many, with a select-all option. | `CdlCombobox` (`cdl-combobox`) | Not when there are only a few options and no search is needed → the Select primitive in ui/select<br>Not when the value is a date or a date range → `CdlDatePicker` |
| A date or date-range picker as a dropdown trigger, for filter bars and forms. | `CdlDatePicker` (`cdl-date-picker`) | Not when the value is a choice from a list → `CdlCombobox` |
| A drag-and-drop panel for users to show, hide and reorder table columns. CdlDataTable already includes it; install it alone only to build a custom table. | `CdlTableConfigurator` (`cdl-table-configurator`) | Not when you need a table whose users can hide and reorder columns → `CdlDataTable` (the columnToggle prop) |
| A table that users sort, filter, search, select, expand and edit in place. The default for any list of records. | `CdlDataTable` (`cdl-data-table`) | Not when the list is short and read-only and needs no filter bar → `CdlTable`<br>Not when you must show what changed between two versions of the rows → `CdlDataTableDiff`<br>Not when the data is the fields of one record, as labels and values → `CdlDataForm` |

**Charts**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| The shared hover tooltip of the CDL charts, for a custom Recharts chart that must match them. | `CdlChartTooltip` (`cdl-chart-tooltip`) | Not when you use a CDL chart → the tooltip already built into that chart |
| Show how values change over time when the filled volume matters, or how stacked parts change over time. | `CdlAreaChart` (`cdl-area-chart`) | Not when a trend line alone is enough → `CdlLineChart`<br>Not when you compare categories, not time → `CdlBarChart` |
| Compare values across categories. | `CdlBarChart` (`cdl-bar-chart`) | Not when the values run over time → `CdlLineChart`<br>Not when the user should click a bar to go one level down → `CdlDrillDownBarChart`<br>Not when you need bars and a line on one axis → `CdlComboChart`<br>Not when you show the parts of one whole → `CdlPieChart` |
| Show how values change over time. | `CdlLineChart` (`cdl-line-chart`) | Not when the filled volume under the line matters → `CdlAreaChart`<br>Not when you need bars and a line on one axis → `CdlComboChart`<br>Not when you compare categories, not time → `CdlBarChart` |
| Bars and lines on one shared Y axis, such as observed values with a fitted curve. | `CdlComboChart` (`cdl-combo-chart`) | Not when you need only bars → `CdlBarChart`<br>Not when you need only lines → `CdlLineChart` |
| A bar chart where a click on a bar goes one level down, with a breadcrumb to go back. | `CdlDrillDownBarChart` (`cdl-drill-down-bar-chart`) | Not when the chart needs no drill-down → `CdlBarChart` |
| Show the parts of one whole, with a few slices. | `CdlPieChart` (`cdl-pie-chart`) | Not when there are more than about six parts or the exact sizes matter → `CdlBarChart`<br>Not when you show one value against a scale → `CdlRadialGauge` |
| One value against a scale or a target, such as budget used or percent complete. | `CdlRadialGauge` (`cdl-radial-gauge`) | Not when a straight bar is enough → `CdlProgress`<br>Not when you need a headline number with a trend → `CdlKpiCard`<br>Not when you show the parts of one whole → `CdlPieChart` |

**Feedback**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| A short-lived toast that confirms the result of an action. | `CdlSonner` (`cdl-sonner`) | Not when the message must stay until the user fixes the cause → `CdlBanner`<br>Not when the user must decide before going on → `CdlDialog` |
| A modal that the user must confirm or answer before going on. | `CdlDialog` (`cdl-dialog`) | Not when the user reads or edits one record and the page should stay visible → `CdlDrawer`<br>Not when you only confirm the result of an action → `CdlSonner` |
| A persistent strip across the page for page-level state: stale data, a degraded service or a pending step. | `CdlBanner` (`cdl-banner`) | Not when you confirm the result of an action and the message can disappear → `CdlSonner`<br>Not when a region has nothing to show → `CdlEmptyState`<br>Not when the state belongs to one table row → `CdlStatusLabel` |
| A toolbar for bulk actions on the rows the user selected, floating or docked along the bottom edge of a table. | `CdlActionBar` (`cdl-action-bar`) | Not when the actions apply to the whole page and stay pinned → `CdlFooterBar`<br>Not when the action applies to one row → the row menu of `CdlDataTable` (the rowMenu prop) |

**Chat**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| The empty screen of a chat: an icon, a title and a short description. | `CdlChatEmptyState` (`cdl-chat-empty-state`) | Not when you need follow-up suggestions under the latest reply → `CdlSuggestedReplies`<br>Not when the empty region is not a chat → `CdlEmptyState` |
| Follow-up reply options under the latest assistant message; a click sends the text as the user's next message. | `CdlSuggestedReplies` (`cdl-suggested-replies`) | Not when you need the empty screen before the first message → `CdlChatEmptyState` |
| The action row under an assistant message: copy, thumbs up and down, and the sources. | `CdlResponseMeta` (`cdl-response-meta`) | Not when you need to show the sources as cards → `CdlSourceCard` |
| A round logo or initials for a data source. | `CdlSourceIcon` (`cdl-source-icon`) | Not when you need a card with the source's path, description and actions → `CdlSourceCard` |
| A card for one data source: logo, resource path, badge, description, time and Preview and Open actions. | `CdlSourceCard` (`cdl-source-card`) | Not when you need only the round logo → `CdlSourceIcon`<br>Not when you need the documents a reasoning step used, as badges → `CdlStepDocuments` |
| A row of document badges under a reasoning step, with icons and a +N more pill. | `CdlStepDocuments` (`cdl-step-documents`) | Not when you need the full card of one source → `CdlSourceCard` |
| One step inside a reasoning panel: a label, an optional description, and optionally the documents it used. | `CdlReasoningStep` (`cdl-reasoning-step`) | Not when you need the whole record of a finished run → `CdlReasoningPanel` |
| The record of a finished AI run: a Thought for 4m24s row that expands into the steps. | `CdlReasoningPanel` (`cdl-reasoning-panel`) | Not when the run is still going → `CdlThinkingIndicator`<br>Not when you need one step on its own → `CdlReasoningStep` |
| One chat message from the user or the assistant, with its status. | `CdlMessageBubble` (`cdl-message-bubble`) | Not when you need the whole scrolling list → `CdlMessageList` |
| A hover rail to jump between the messages of a long chat thread. | `CdlMessageRail` (`cdl-message-rail`) | Not when you want the rail inside a CdlMessageList or a CdlChatPanel → the showNavRail prop of `CdlMessageList` or `CdlChatPanel` |
| A scrollable list of chat messages, with an optional navigation rail, when you build the chat layout yourself. | `CdlMessageList` (`cdl-message-list`) | Not when you want the list and the input already combined → `CdlChatPanel` |
| The wait state while an AI reply is generated: steps gather on a rail, then give way to the reasoning record. | `CdlThinkingIndicator` (`cdl-thinking-indicator`) | Not when the run is finished and you show its record → `CdlReasoningPanel`<br>Not when the wait state must show a failed step or an elapsed counter → the archived `CdlThinkingIndicatorLegacy` — revive it first (move it out of archive/), do not import it from archive |
| The chat input: multi-line text, send, slash-command skills and an optional action menu. | `CdlInputBar` (`cdl-input-bar`) | Not when you want the list and the input already combined → `CdlChatPanel` |
| A whole AI chat: the message list and the input bar together. The usual starting point for a chat screen. | `CdlChatPanel` (`cdl-chat-panel`) | Not when you lay out the message list and the input yourself → `CdlMessageList` and `CdlInputBar` |
| A collapsible rail of chat sessions with search and New chat, docked or floating over the chat. | `CdlChatSidebar` (`cdl-chat-sidebar`) | Not when the sessions belong inside the app sidebar → `CdlChatSessionList` |
| The chat sessions as a nav group inside the app sidebar: New chat, search, rename and delete. | `CdlChatSessionList` (`cdl-chat-session-list`) | Not when the sessions need their own rail beside the chat → `CdlChatSidebar` |

**Auth**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| A sign-in card with email and password fields and buttons for sign-in providers. | `CdlLoginCard` (`cdl-login-card`) |  |

**Experimental**

| If you need… | Use (registry name) | Not when… → use instead |
|---|---|---|
| A table that highlights the rows added, removed or changed between two versions of the data. Experimental. | `CdlDataTableDiff` (`cdl-data-table-diff`) | Not when you show one version of the data → `CdlDataTable` |

<!-- CDL_MAPPING:end -->

---

## Component Reference

### Layout

#### `CdlPageContainer`
Full page shell — sidebar, breadcrumb header, tab bar, content area. **Always the outermost wrapper for an app page.**

```tsx
import { CdlPageContainer } from "@/components/cdl/layout/cdl-page-container"

<CdlPageContainer
  title="Page Title"
  segments={["Section", "Page Title"]}       // breadcrumb trail
  actions={<Button>Action</Button>}           // top-right slot
  navLinks={[                                 // tab bar
    { label: "Overview" },
    { label: "Details", icon: InfoIcon },
  ]}
  navVariant="default"                        // or "process" / "gated" — see CdlTabs
  defaultTab="Overview"
  onTabChange={(label) => {}}
  overflow="auto"                             // "hidden" for full-height children
  contentClassName="p-6"
  theme="ac"                                  // optional brand theme (see docs/theming.md)
  sidebar={{
    appName: "My App",
    navGroups: [...],
    userEmail: "user@example.com",
  }}
>
  {/* content for active tab */}
</CdlPageContainer>
```

`overflow="hidden"` + `flex-1 min-h-0` on children = full-height scrollable panels (e.g. chat, tall tables).

#### `CdlTabs`
The underlined tab bar with the spring-animated indicator, extracted from `CdlPageContainer` (which uses it internally). Reach for it when you need Compass-styled tabs **outside** the full page shell — e.g. tabbed sections inside a card or drawer. The sliding indicator is namespaced per instance.

```tsx
import { CdlTabs } from "@/components/cdl/layout/cdl-tabs"

// Self-contained: each tab owns its content
<CdlTabs
  defaultTab="Overview"
  items={[
    { label: "Overview", icon: <LayoutDashboard />, content: <Overview /> },
    { label: "Activity", badge: "12", content: <Activity /> },
  ]}
/>

// Controlled: parent owns active state, one shared body
<CdlTabs activeTab={tab} onTabChange={setTab} items={[{ label: "Overview" }, { label: "Activity" }]}>
  {renderBody(tab)}
</CdlTabs>
```

Add `fill` for a pinned bar + scrolling content area inside a height-bounded parent (this is the page-container layout). For a full app page, prefer `CdlPageContainer`'s `navLinks` over composing `CdlTabs` yourself.

**Stepped variants.** When the tabs hold a *process* rather than peer views, set `variant`. Both raise the bar to 48px and put a state marker before each label; the sliding indicator is unchanged.

```tsx
// variant="process" — linear. The number is the position in `items`, never typed by hand.
<CdlTabs
  variant="process"
  activeTab={step}
  onTabChange={setStep}
  items={[
    { label: "Prompt", status: "complete" },   // check marker
    { label: "Template details" },             // current step: outlined number
    { label: "Fields", status: "attention" },  // visited, failed its check
    { label: "Review", status: "locked" },     // blocked; tooltip names the step that unlocks it
  ]}
/>

// variant="gated" — any order, one final step held shut until the rest report done.
<CdlTabs
  variant="gated"
  activeTab={tab}
  onTabChange={setTab}
  items={[
    { label: "Crew hours", done: true },
    { label: "Vendor invoices", badge: "3 / 8" },  // dashed ring = not done
    { label: "Adjustments" },
    { label: "Submit close", gate: true },         // last item; locked behind a rule until the rest are done
  ]}
/>
```

Rules that matter:
- `process` numbers by array position, so reordering `items` renumbers the steps.
- `gated` never inspects panel content — the page owns completion and reports `done` per item.
- Every non-gate tab holds the gate shut until it reports `done`. There is no opt-out.
- One `gate` item at most, and it must be last. Move `activeTab` off it if a tab reopens.
- Keep either variant to six steps. Past that, give the process its own routes.
- `gated` works with no `gate` item at all: every tab then reads done or not done, and nothing locks. Use that when the steps have no terminal dependency.

For a full app page, do not compose `CdlTabs` yourself — pass `navVariant` to `CdlPageContainer` and put `done` / `gate` / `status` on the `navLinks` items.

#### `CdlBlockGroup` / `CdlBlockHeader` / `CdlBlockContent` / `CdlBlockFooter`
Panel container. Use `variant="flush"` inside `CdlCard` or when the panel sits directly on a page background without needing a bordered box.

```tsx
import {
  CdlBlockGroup, CdlBlockHeader, CdlBlockContent, CdlBlockFooter
} from "@/components/cdl/layout/cdl-block-group"

<CdlBlockGroup className="flex-1 min-h-0">
  <CdlBlockHeader title="Users" actions={<Button size="sm">Add</Button>} />
  <CdlBlockContent className="p-4">
    {/* content */}
  </CdlBlockContent>
  <CdlBlockFooter>
    <Button variant="outline" size="sm">Export</Button>
  </CdlBlockFooter>
</CdlBlockGroup>
```

`CdlBlockContent` has zero padding by default — add `className="p-4"` when needed. For tables that manage their own scroll, omit the padding.

#### `CdlFooterBar`
Page-level actions pinned flush to the bottom edge of the content area, with an optional status message to the left. Use it for the final action of a page or flow ("Send to client", "Save changes"). It is not a bulk-selection toolbar — use `CdlActionBar` for that.

Place it last in a full-height flex column, below a scrolling region, so only the content scrolls. With `CdlPageContainer`, pass `overflow="hidden"` and `contentClassName="p-0 gap-0"` so the bar touches the page edges.

```tsx
import { CdlFooterBar } from "@/components/cdl/layout/cdl-footer-bar"

<CdlPageContainer title="Review" overflow="hidden" contentClassName="p-0 gap-0">
  <div className="flex h-full min-h-0 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto p-4">{/* content */}</div>
    <CdlFooterBar message="4 of 6 answers still to review">
      <Button disabled>Send to client</Button>
    </CdlFooterBar>
  </div>
</CdlPageContainer>
```

#### `CdlCard` / `CdlCardHeader` / `CdlCardContent` / `CdlCardFooter`
Lighter card without the panel chrome. Good for grid layouts of similar items.

```tsx
import { CdlCard, CdlCardHeader, CdlCardContent } from "@/components/cdl/display/cdl-card"

<CdlCard>
  <CdlCardHeader title="Revenue" description="Last 30 days" actions={<Badge>+12%</Badge>} />
  <CdlCardContent className="p-4">…</CdlCardContent>
</CdlCard>
```

#### `CdlDrawer`
Slide-in side panel. The drawer owns the inset: the header, the body, and the footer
all sit at `p-4`, so pass the content itself and never wrap it in a padded container.
Set `flushBody` when the body must run edge to edge — a table, a tab bar, or stacked
sections that carry their own dividers and padding.

```tsx
import { CdlDrawer } from "@/components/cdl/layout/cdl-drawer"

<CdlDrawer
  open={open}
  onOpenChange={setOpen}
  width="md"                  // "sm" | "md" | "lg"
  header={<h2>Details</h2>}
  footer={<Button>Save</Button>}
>
  {/* scrollable body — no padding of its own */}
</CdlDrawer>
```

#### `CdlDetailPanel`
Inline side panel with a header, a close button and optional tabs. It slides in **beside** the main content, so the user keeps the page in view; it does not cover it (use `CdlDrawer` for that). Give it a flex-row parent; it takes its own width. Pass `tabs` (each with `id`, `label`, `content`, optional `footer`) or plain `children`. Set `resetKey` to the id of the record it shows so a new record opens on the first tab at the top. Keep it mounted and toggle `open` to animate it out; `hideClose` makes it a permanent rail.

```tsx
import { CdlDetailPanel } from "@/components/cdl/layout/cdl-detail-panel"

<div className="flex h-full min-h-0">
  <div className="min-w-0 flex-1">{/* table */}</div>
  <CdlDetailPanel
    open={!!selected}
    title={selected?.name}
    resetKey={selected?.id}
    onClose={() => setSelected(null)}
    tabs={[
      { id: "overview", label: "Overview", content: <Overview row={selected} /> },
      { id: "history", label: "History", badge: "3", content: <History row={selected} /> },
    ]}
  />
</div>
```

#### `CdlTree`
Recursive file/folder tree for a navigation rail beside a table or content pane. Branches (nodes with `children`) expand/collapse; clicking a branch selects it and toggles expansion. Wire `onRenameFolder` / `onDeleteFolder` to add a hover-revealed actions menu on folder rows — Rename edits the label inline (commit on Enter/blur, cancel on Escape); Delete fires the callback (update your `nodes` data in the handler — the tree does not remove nodes itself).

```tsx
import { CdlTree, type CdlTreeNode } from "@/components/cdl/layout/cdl-tree"

const nodes: CdlTreeNode[] = [
  { id: "all", label: "All Documents", count: 34 },
  { id: "reports", label: "Reports", count: 12, children: [
    { id: "reports-q2", label: "Q2", count: 8 },
  ]},
]

<CdlTree
  nodes={nodes}
  selectedId={folderId}          // controlled selection (or use defaultSelectedId)
  onSelect={(id) => setFolderId(id)}
  defaultExpandedIds={true}      // expand all branches; or pass an id array
  onRenameFolder={(id, newLabel) => renameFolder(id, newLabel)}  // adds folder menu + inline rename
  onDeleteFolder={(id) => deleteFolder(id)}                       // adds destructive Delete item
/>
```

#### `CdlPreviewPane`
Persistent viewer pane for a document/detail layout — header (icon, title, `meta` row), a scrollable framed body for `children`, and a built-in empty state. Pairs with `CdlTree`: the tree navigates, this pane views. Fills its parent, so give it a flex-row parent with the tree sidebar beside it. Considered empty (shows `emptyState`) when it has no `title` and no `children` — or force it with `isEmpty`.

```tsx
import { CdlPreviewPane } from "@/components/cdl/layout/cdl-preview-pane"
import { CdlEmptyState } from "@/components/cdl/display/cdl-empty-state"
import { FileText, CursorClick } from "@phosphor-icons/react"

<CdlPreviewPane
  isEmpty={!doc}                 // or omit — auto-empty when no title/children
  icon={<FileText className="size-5" />}
  title={doc?.name}
  meta={doc && <><Badge>{doc.type}</Badge><span>{doc.owner}</span></>}
  emptyState={
    <CdlEmptyState icon={CursorClick} title="Select a document to preview"
      description="Choose a file from the folders on the left to see it here." />
  }
>
  {doc && <DocumentBody doc={doc} />}   {/* framed on a page surface; set framed={false} for full-bleed */}
</CdlPreviewPane>
```

#### `CdlAppSidebar`
Used automatically via `CdlPageContainer`'s `sidebar` prop. Pass directly only when building a custom layout without `CdlPageContainer`.

```tsx
sidebar={{
  appName: "Compass Analytics",
  appDescription: "Internal Tools",
  navGroups: [
    {
      label: "Main",
      items: [
        { title: "Dashboard", icon: LayoutDashboardIcon, href: "/" },
        { title: "Reports",   icon: BarChartIcon,        href: "/reports", badge: "3" },
      ],
    },
  ],
  pinnedNavGroups: [
    { items: [{ title: "Settings", icon: SettingsIcon, href: "/settings" }] },
  ],
  userEmail: "user@compassdata.ca",
  userInitials: "JZ",
}}
```

**Section rules.** To rule off nav groups that are distinct sections of one flow, compose the content area through `children` — the same rule that sits above `pinnedNavGroups`:

```tsx
<CdlAppSidebar>
  {groups.map((group, i) => (
    <Fragment key={group.label}>
      {i > 0 && <CdlAppSidebarSeparator />}
      <CdlAppSidebarGroup group={group} />
    </Fragment>
  ))}
</CdlAppSidebar>
```

**Settings row.** The default Settings items are placeholders with no actions. Pass `settingsMenu` with `DropdownMenuItem`s that do something, or `settingsMenu={null}` to remove the row when the app has no settings surface.

**Nested nav.** Give an item its own `items` to turn it into a collapsible section — the row toggles its children instead of navigating, so `href`/`onClick` are ignored on it. Nests to any depth; each level indents and gets a guide line. The section holding the active item opens automatically (and reopens when the active item moves into it), but stays closed if the user closes it. Use `defaultOpen` to expand a section that does not hold the active item. Nested levels hide when the sidebar collapses to its icon rail.

```tsx
navGroups: [
  {
    label: "Master Data",
    items: [
      {
        title: "Rates",
        items: [
          { title: "Fuel Grid",   icon: FuelIcon,   active: key === "fuelGrid", onClick: () => setKey("fuelGrid") },
          { title: "Maintenance", icon: WrenchIcon, active: key === "maintenance", onClick: () => setKey("maintenance") },
        ],
      },
      { title: "Mapping", defaultOpen: true, items: [/* … */] },
    ],
  },
]
```

---

### Display

#### `CdlKpiCard`
Metric tile with optional trend and progress bar.

```tsx
import { CdlKpiCard } from "@/components/cdl/display/cdl-kpi-card"

<CdlKpiCard
  header="Monthly Revenue"
  value="$124,500"
  change={12.4}                       // positive = up arrow + green, negative = red
  changePeriod="vs last month"
  icon={DollarSignIcon}
  progress={68}                       // 0–100, renders a progress bar
  loading={isLoading}
  density="compact"                   // "default" (110px, header and value at opposite ends) | "compact" (~72px, stacked)
/>
```

Use `density="compact"` when the KPI row is a summary strip above the real content and the height is better spent below. Keep the default when the KPIs are the point of the screen, or when cards hold uneven content and you want one shared height across the row.

KPI grids: `<div className="grid grid-cols-4 gap-4">`.

> Note: `CdlKpiCard`'s built-in `progress` prop is ignored when the card uses `children`. For a custom body that still needs a bar, drop a `CdlProgress` inside the `children`.

#### `CdlProgress`
Horizontal fill bar with an optional target/pace marker.

```tsx
import { CdlProgress } from "@/components/cdl/display/cdl-progress"

// Plain fill (max defaults to 100)
<CdlProgress value={68} label="Storage used" />

// Fill against a target/pace marker — e.g. budget spend vs % of year elapsed
<CdlProgress
  value={59}
  marker={55}
  markerLabel="55% of year elapsed"
  variant="danger"                    // default | success | warning | danger
  size="md"                           // sm | md | lg
  label="Budget spent"
  loading={isLoading}
/>
```

#### `CdlBadge`
Status label with semantic variants.

```tsx
import { CdlBadge } from "@/components/cdl/display/cdl-badge"

<CdlBadge variant="success">Active</CdlBadge>
// variants: default | secondary | outline | destructive | success | warning | info
```

#### `CdlTag`
Dismissible chip.

```tsx
import { CdlTag } from "@/components/cdl/display/cdl-tag"

<CdlTag onRemove={() => removeTag(id)}>Engineering</CdlTag>
```

#### `CdlEmptyState`
Zero-state placeholder for empty lists or search results.

```tsx
import { CdlEmptyState } from "@/components/cdl/display/cdl-empty-state"

<CdlEmptyState
  icon={InboxIcon}
  title="No results"
  description="Try adjusting your filters."
  variant="default"                   // "default" | "success" | "warning" | "destructive"
  actions={<Button>Clear filters</Button>}
/>
```

---

### Data

#### `CdlDataTable`
Full-featured table: sorting, filtering, column config, row selection, drill-down, inline editing, add row.

```tsx
import { CdlDataTable } from "@/components/cdl/data/cdl-data-table"
import { type ColumnDef } from "@tanstack/react-table"

const columns: ColumnDef<User>[] = [
  { accessorKey: "name",  header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role",  header: "Role" },
]

<CdlDataTable
  data={users}
  columns={columns}
  loading={isLoading}
  showSearch
  filterFields={[
    // key (matches the column id), label, operators, options — all required.
    // operators: "is" | "is not" | "is any of" | "is above" | "is below" | "is between"
    { key: "role", label: "Role", operators: ["is", "is not", "is any of"], options: ["Admin", "Member", "Viewer"] },
  ]}
  columnToggle="dropdown"             // "dropdown" | "dialog" | "none"
  // Per column: meta: { defaultHidden: true } ships it switched off but still
  // listed in the Columns control. Needs columnToggle to not be "none".
  onRowClick={(row) => openDrawer(row)}
  emptyState={<CdlEmptyState icon={UsersIcon} title="No users" description="Add one to get started." />}
  enableSelection
  onSelectionChange={(rows) => setSelected(rows)}
  onDeleteRow={(row) => deleteUser(row.id)}
  scrollable                          // sticky header, body scrolls; parent must constrain height
/>
```

**Layout rule for scrollable tables:** wrap in a height-constrained flex container.

```tsx
<CdlBlockGroup className="flex-1 min-h-0">
  <CdlBlockHeader title="Users" />
  <CdlBlockContent className="min-h-0 flex-1">
    <CdlDataTable data={data} columns={columns} scrollable />
  </CdlBlockContent>
</CdlBlockGroup>
```

**Inline editing keys.** Editable cells (`meta: { editable: true }`) work like a spreadsheet: Enter commits and moves down the same column (Shift+Enter up, and the last row stays), Tab / Shift+Tab move to the next or previous editable cell and wrap across rows (row controls between cells stay in the Tab order), and Escape restores the value from when the cell took focus. A select keeps its native keys. The keys follow the visible rows, so sorting, filtering, pagination and pinned columns need no setup.

#### `CdlTable`
Lightweight sortable table, no filter bar or configurator. Prefer for simple read-only lists.

```tsx
import { CdlTable } from "@/components/cdl/data/cdl-table"

<CdlTable data={rows} columns={columns} loading={loading} />
```

#### `CdlDataForm`
Inline editable key-value rows. Good for entity detail views.

```tsx
import { CdlDataForm } from "@/components/cdl/data/cdl-data-form"

<CdlDataForm
  fields={[
    { id: "name",  label: "Name",  type: "text" },
    { id: "email", label: "Email", type: "text" },
    { id: "role",  label: "Role",  type: "select", options: ["Admin", "Member"] },
  ]}
  values={{ name: "Jerry", email: "jerry@compassdata.ca", role: "Admin" }}
  onChange={(id, value) => updateField(id, value)}
  readOnly={!isEditing}
/>
```

#### `CdlTableConfigurator`
Lets users show, hide and reorder the columns of a table by drag and drop. `CdlDataTable` already mounts it (`columnToggle="dropdown"` or `"dialog"`), so install it on its own only for a custom table. `variant="dropdown"` suits few columns; `variant="dialog"` suits many. Pass `columns` as `{ id, label, visible }[]` and read the new order and visibility from `onChange`. `reorderable={false}` hides the drag handles.

```tsx
import { CdlTableConfigurator, type CdlColumnConfig } from "@/components/cdl/data/cdl-table-configurator"

<CdlTableConfigurator
  variant="dialog"
  columns={columns}                       // CdlColumnConfig[]
  onChange={(next) => setColumns(next)}
/>
```

#### `CdlDataTableFilter`
The filter panel of a data table: faceted conditions with an operator and one or more values, joined with and/or. `CdlDataTable` already includes it (`filterFields`), so install it on its own only for a custom filter bar. Each field is `{ key, label, operators, options }`; the panel hands back the full condition list through `onChange`.

```tsx
import { CdlDataTableFilter, type CdlFilterCondition } from "@/components/cdl/data/cdl-data-table-filter"

<CdlDataTableFilter
  fields={[{ key: "role", label: "Role", operators: ["is", "is not", "is any of"], options: ["Admin", "Member"] }]}
  filters={filters}                       // CdlFilterCondition[]
  onChange={setFilters}
/>
```

#### `CdlDatePicker`
Date or date-range picker, surfaced as a dropdown trigger button + popover calendar. Use for date filters in a filter bar, or a date field in a form.

```tsx
import { CdlDatePicker } from "@/components/cdl/data/cdl-date-picker"

// Single date
const [date, setDate] = useState<Date | undefined>()
<CdlDatePicker value={date} onChange={setDate} placeholder="Pick a date" />

// Date range
const [range, setRange] = useState<DateRange | undefined>()
<CdlDatePicker mode="range" value={range} onChange={setRange} placeholder="Pick a date range" />

// Earliest pickable day (works in both modes)
<CdlDatePicker value={date} onChange={setDate} minDate={new Date()} />
```

#### `CdlCombobox`
Searchable dropdown, single or multi-select. Reach for this instead of `Select` once a list is long enough that a user would want to type to find an option (partners, stations, users), and instead of hand-rolling `Popover` + `Command` — shadcn ships no combobox component, so this is that composition, already solved.

```tsx
import { CdlCombobox } from "@/components/cdl/data/cdl-combobox"

// Single select — options can be plain strings
const [partner, setPartner] = useState<string | undefined>()
<CdlCombobox options={["Lufthansa", "SWISS"]} value={partner} onChange={setPartner} placeholder="Select a partner" />

// Multi select — an empty array means "all", so the placeholder doubles as the no-filter label
const [partners, setPartners] = useState<string[]>([])
<CdlCombobox
  mode="multi"
  options={PARTNERS}
  value={partners}
  onChange={setPartners}
  placeholder="All partners"
  summaryNoun="partners"
/>

// Objects add a muted trailing hint; options can be individually disabled
<CdlCombobox options={[{ value: "YYZ", label: "YYZ", hint: "Toronto" }]} … />

// Nested options — any depth. Only leaves are values.
<CdlCombobox
  mode="multi"
  options={[
    { value: "star", label: "Star Alliance", children: [
      { value: "lh", label: "Lufthansa" },
      { value: "lx", label: "SWISS" },
    ]},
    { value: "contract", label: "Contract lounges", children: ["Plaza Premium", "Aspire"] },
  ]}
  value={partners}       // → ["lh", "lx"] — never "star"
  onChange={setPartners}
/>
```

Notes:
- **Multi mode treats an empty selection as "everything."** The trigger shows `placeholder` for both none-selected and all-selected, because those are the same query — it describes the result, not the checkbox tally.
- **`selectAll` (on by default) is tri-state**, the spreadsheet convention: one click selects all, a second clears, and a partial selection fills up first. It also makes "all except one" expressible. With a search active it acts only on the matches.
- **Nesting (`children`) selects only leaves.** A parent id never appears in `value`. In multi mode a parent is a tri-state checkbox that cascades over its subtree and rolls its state up; in single mode it is a heading, not selectable. Counts and Select all count leaves, so don't pass a group id as a selected value.
- The popover matches the trigger width (min 220px). Set width on the trigger via `className`.
- Use `loading` while options are being fetched — it renders skeleton rows in the list.

---

### Charts

All charts default colors to `var(--chart-1)` through `var(--chart-5)`. Never hardcode hex values — use CSS variables so charts respond to dark mode and brand themes.

#### `CdlBarChart`

```tsx
import { CdlBarChart } from "@/components/cdl/charts/cdl-bar-chart"

<CdlBarChart
  data={[{ month: "Jan", sales: 4200, returns: 310 }, ...]}
  xKey="month"
  series={[
    { key: "sales",   label: "Sales",   color: "var(--chart-1)" },
    { key: "returns", label: "Returns", color: "var(--chart-2)" },
  ]}
  height={300}           // or "100%" to fill parent height
  stacked={false}
  showLegend
  showGrid
/>
```

#### `CdlDrillDownBarChart`

Power BI-style drill-down: describe the hierarchy as ordered `levels`; clicking a bar descends
to the next level (scoped to that category). A breadcrumb appears once drilled in and lets the
user climb back. Deepest-level bars fire `onLeaf` instead of drilling — hand off to a detail view.

```tsx
import { CdlDrillDownBarChart, type DrillLevel } from "@/components/cdl/charts/cdl-drill-down-bar-chart"

const levels: DrillLevel[] = [
  // Top level. `getBars` receives the drill path (empty at the top).
  { name: "Revenue by region", getBars: () => regions.map((r) => ({ key: r.name, value: r.total })) },
  // Next level — scoped to the clicked key at path[0]. Bars can carry a `color`,
  // a `badge` (shown in the centered legend + tooltip), and `meta` (passed to onLeaf).
  { name: "Revenue by region", getBars: (path) =>
      countriesIn(path[0]).map((c) => ({ key: c.name, value: c.total, meta: c.id })) },
]

<CdlDrillDownBarChart
  levels={levels}
  height={300}
  valueFormatter={(n) => `$${(n / 1_000_000).toFixed(1)}M`}
  onLeaf={(path, bar) => navigate(`/detail/${bar.meta}`)}
/>
```

#### `CdlLineChart`

```tsx
import { CdlLineChart } from "@/components/cdl/charts/cdl-line-chart"

<CdlLineChart
  data={[{ week: "W1", actual: 120, target: 150 }, ...]}
  xKey="week"
  series={[
    { key: "actual", label: "Actual", color: "var(--chart-1)" },
    { key: "target", label: "Target", color: "var(--chart-2)", dashed: true },
  ]}
  height={300}
  showDots
/>
```

#### `CdlComboChart`

Bar and line series drawn onto a single shared Y-axis — for showing observed values as bars with
fitted or reference curves over them. Each series declares its own `type`.

```tsx
import { CdlComboChart } from "@/components/cdl/charts/cdl-combo-chart"

<CdlComboChart
  data={[{ bin: "0-2", daysObserved: 4, normalFit: 3.1 }, ...]}
  xKey="bin"
  xAxisLabel="Questions in a day"
  yAxisLabel="# of days"
  series={[
    { key: "daysObserved", label: "Days Observed", type: "bar", color: "var(--chart-1)" },
    { key: "normalFit", label: "Normal fit", type: "line", color: "var(--chart-2)", dashed: true },
  ]}
  height={280}
/>
```

#### `CdlPieChart`

```tsx
import { CdlPieChart } from "@/components/cdl/charts/cdl-pie-chart"

<CdlPieChart
  data={[{ category: "Direct", revenue: 5000 }, ...]}
  nameKey="category"
  valueKey="revenue"
  slices={[
    { key: "Direct",  label: "Direct",  color: "var(--chart-1)" },
    { key: "Partner", label: "Partner", color: "var(--chart-2)" },
  ]}
  height={300}
  donut={false}
  showLegend
  showValues="percent"             // "value" | "percent" | "both" — draws the figure on each slice
  valueFormatter={(v) => `$${v}M`} // formats the raw value in a label and in the tooltip
  percentDigits={0}                // decimals on a percentage label
  labelsOutside                    // labels outside with a leader line, for small or light slices
/>
```

Without `showValues` the figures live in the tooltip, which costs a hover — pass it when the
chart has to be read at a glance. Inside labels sit on the slice fill in the
`primary-foreground` token and are skipped on any slice under 5%; `labelsOutside` labels
every slice and shrinks the circle to make room.

#### `CdlRadialGauge`

```tsx
import { CdlRadialGauge } from "@/components/cdl/charts/cdl-radial-gauge"

<CdlRadialGauge
  value={72}                       // clamped to 0–max
  max={100}
  valueLabel="72%"                 // centered text; pass a preformatted string for units, e.g. "$17.6M"
  sublabel="of budget"
  variant="warning"                // default | success | warning | danger (token-based)
  size={160}                       // diameter in px
  target={100}                     // optional tick on the ring; keep max above it so an over-target fill crosses it
  targetLabel="target"             // tooltip on the tick
  // startAngle / endAngle default to a full circle (90 to -270); loading shows a circular skeleton
/>
```

#### Charts filling panel height

```tsx
<CdlBlockContent className="p-4 min-h-0 flex-1">
  <CdlBarChart data={data} xKey="x" series={series} height="100%" />
</CdlBlockContent>
```

---

### Feedback

#### `CdlDialog`

```tsx
import {
  CdlDialog, CdlDialogTrigger, CdlDialogContent,
  CdlDialogHeader, CdlDialogBody, CdlDialogFooter, CdlDialogClose
} from "@/components/cdl/feedback/cdl-dialog"

<CdlDialog>
  <CdlDialogTrigger asChild>
    <Button>Open</Button>
  </CdlDialogTrigger>
  <CdlDialogContent>
    <CdlDialogHeader title="Confirm Action" />
    <CdlDialogBody>Are you sure?</CdlDialogBody>
    <CdlDialogFooter>
      <CdlDialogClose asChild><Button variant="outline">Cancel</Button></CdlDialogClose>
      <Button onClick={confirm}>Confirm</Button>
    </CdlDialogFooter>
  </CdlDialogContent>
</CdlDialog>
```

#### `CdlBanner`
Persistent, page-level status strip — a severity icon pinned to the heading, title/description, and an optional action or dismiss. Use for contextual state tied to the page's data (stale feeds, degraded service, a pending step), not transient toasts (use `CdlSonner`). The `action` renders as a primitive Button; the action and dismiss are centred vertically.

```tsx
import { CdlBanner } from "@/components/cdl/feedback/cdl-banner"

<CdlBanner
  severity="warning"                 // "info" | "warning" | "error" | "success"
  title="2 of 4 data feeds need attention"
  description="IATA Clearinghouse, SAC Load — figures below may be stale or incomplete."
  action={{ label: "View load health", href: "/ingestion" }}
  // onDismiss={() => setHidden(true)}   // optional × button
  // icon={Warning}                       // optional Phosphor icon override
/>
```

#### `CdlActionBar`
Floating bulk-action toolbar — pair with `CdlDataTable`'s `enableSelection` + `onSelectionChange`.

```tsx
import { CdlActionBar } from "@/components/cdl/feedback/cdl-action-bar"

<CdlActionBar
  open={selected.length > 0}
  count={selected.length}
  countLabel="Rows Selected"
  actions={[
    { label: "Export", icon: DownloadIcon, onClick: exportRows },
    { label: "Assign", icon: UserIcon,     onClick: assignRows },
  ]}
  onDeselect={() => setSelected([])}
  onDelete={deleteSelected}
  deleteConfirmTitle="Delete rows?"
  deleteConfirmDescription="This cannot be undone."
/>
```

`variant="docked"` makes a full-width bar flush against the bottom edge of its container (Deselect and count left, actions right) — use it where the bar must not cover the table. Mark at most one action `emphasis: "primary"` to fill it. The bar keeps its last count and actions during the exit fade.

#### `CdlStatusLabel`
Quiet status: an icon and a word, no container. Use it for a status column or a detail row instead of a coloured `CdlBadge` per row. Routine states take `neutral` or `ok`; reserve `warn` and `error` for what needs attention.

```tsx
import { CdlStatusLabel, CDL_TONE_TEXT } from "@/components/cdl/display/cdl-status-label"

<CdlStatusLabel tone="warn" label="Above tolerance" description="Variance exceeds the 2% limit." />
<span className={CDL_TONE_TEXT.error}>-$12,400</span>   {/* tint a number instead of adding a pill */}
```

#### `CdlSonner`
Mount once at app root.

```tsx
import { CdlSonner } from "@/components/cdl/feedback/cdl-sonner"
import { toast } from "sonner"

// In root layout:
<CdlSonner />

// Trigger from anywhere:
toast.success("Saved")
toast.error("Something went wrong")
```

---

### Chat

#### `CdlChatPanel`
Complete AI chat interface. Connect to your LLM stream via `onSubmit` and `messages`.

```tsx
import { CdlChatPanel } from "@/components/cdl/chat/cdl-chat-panel"
import type { ChatMessage } from "@/components/cdl/chat/cdl-chat-types"

const [messages, setMessages] = useState<ChatMessage[]>([])

<CdlChatPanel
  title="Assistant"
  messages={messages}
  status="idle"              // "idle" | "loading" | "streaming" | "error"
  onSubmit={(query) => sendToLLM(query)}
  placeholder="Ask anything…"
  emptyState={<CdlChatEmptyState prompts={["Summarise...", "Show me..."]} onSelect={...} />}
  assistantIcon={<BotIcon className="size-5" />}
  headerActions={<Button variant="ghost" size="icon"><XIcon /></Button>}
/>
```

The Sources panel docks beside the chat by default (`sourcesLayout="side"`). For a narrow chat (a sheet or rail) pass `sourcesLayout="overlay"`: it lays over the messages and input, below the header.

For a full-height chat panel inside `CdlPageContainer`:

```tsx
<CdlPageContainer overflow="hidden" ...>
  <CdlChatPanel ... className="flex-1 min-h-0" />
</CdlPageContainer>
```

#### `CdlInputBar`
The chat input: a multi-line editor with send, an optional strip of toolbar buttons below it, and slash-command skills. Typing `/` at the start of the message or after a space opens a filterable menu of `slashCommands`; a picked command is inserted inline and highlighted. `CdlChatPanel` already includes it; use it on its own when you lay the chat out yourself.

```tsx
import { CdlInputBar, CdlInputBarButton } from "@/components/cdl/chat/cdl-input-bar"
import { Plus } from "@phosphor-icons/react"

<CdlInputBar
  onSubmit={(text, attachments) => send(text, attachments)}
  disabled={isStreaming}
  placeholder="Ask a question"
  slashCommands={[{ label: "summarize" }, { label: "compare" }]}
  // children = toolbar strip, left side; rightChildren = the right side
  rightChildren={<CdlInputBarButton label="Add" icon={<Plus />} items={menuItems} />}
/>
```

#### `CdlMessageRail`
A hover rail of ticks in the gutter of a long chat thread: one tick per turn, a preview on hover, a click to jump there. It is presentational: `CdlMessageList` and `CdlChatPanel` drive it when you set `showNavRail`, using the `useMessageScrollerVisibility` hook from `@shadcn/react/message-scroller` (`chat/index.ts` re-exports it), so you rarely mount it yourself. Pass `items` (`{ id, label }` in conversation order), `activeId`, `visibleIds` and `onJump`.

```tsx
import { CdlMessageRail } from "@/components/cdl/chat/cdl-message-rail"

<CdlMessageRail
  items={turns.map((t) => ({ id: t.id, label: t.question }))}
  activeId={activeId}
  visibleIds={visibleIds}
  onJump={(id) => scrollToMessage(id)}
/>
```

#### `CdlSuggestedReplies`
Full-width reply rows under the **latest** assistant message. Each row sends its text as the user's next message. Hide it while an answer is in flight. It is for replies only — an action that writes something belongs on the thing it acts on.

```tsx
import { CdlSuggestedReplies } from "@/components/cdl/chat/cdl-suggested-replies"

<CdlSuggestedReplies
  replies={["Break it down by region", "Compare to last quarter"]}
  onSelect={(reply) => sendToLLM(reply)}
  disabled={status !== "idle"}
/>
```

#### `CdlChatSidebar`
Collapsible chat-session rail with search and a "New chat" action. Toggles between a
docked in-layout rail and a floating overlay card. The floating and collapsed-docked
states position absolutely, so render it inside a `relative` container.

```tsx
import { CdlChatSidebar, type CdlChatSession } from "@/components/cdl/chat/cdl-chat-sidebar"

const sessions: CdlChatSession[] = [{ id: "c1", title: "Q1 revenue breakdown" }, ...]
const [active, setActive] = useState("c1")

<div className="relative flex h-full">
  <CdlChatSidebar
    sessions={sessions}
    activeId={active}
    onSelect={setActive}
    onNewChat={() => setActive("")}
    defaultMode="docked"        // "docked" | "floating"
  />
  <CdlChatPanel ... className="flex-1 min-h-0" />
</div>
```

#### `CdlChatSessionList`
Presentational chat-session list built to drop into a `CdlAppSidebar` nav group's
`content` slot. Renders an optional "New chat" button, a search field, and the list
with an active-row highlight, inline rename, and a hover `⋯` menu (Rename / Delete).
State stays with you (`sessions` + callbacks); Rename and Delete appear only when their
callbacks are passed. Use a **label-less, non-collapsible** group so it reads as a plain
chat history with no header or fold.

```tsx
import { CdlChatSessionList } from "@/components/cdl/chat/cdl-chat-session-list"
import { type CdlChatSession } from "@/components/cdl/chat/cdl-chat-sidebar"

const [sessions, setSessions] = useState<CdlChatSession[]>([{ id: "c1", title: "Q1 revenue" }])
const [active, setActive] = useState("c1")

<CdlAppSidebar
  navGroups={[{
    collapsible: false,          // no label + no fold → plain chat history
    content: (
      <CdlChatSessionList
        sessions={sessions}
        activeId={active}
        onSelect={setActive}
        onNewChat={() => setActive("")}
        onRename={(id, title) => setSessions((p) => p.map((s) => (s.id === id ? { ...s, title } : s)))}
        onDelete={(id) => setSessions((p) => p.filter((s) => s.id !== id))}
      />
    ),
  }]}
/>
```

#### `CdlReasoningPanel` / `CdlThinkingIndicator`
The two halves of the reply cycle. `CdlThinkingIndicator` is the **live** wait state:
steps accumulate down a hairline rule in a box exactly four rows tall, and older ones
scroll out of view so the height never changes and the answer never moves.
`CdlReasoningPanel` is the **record**: a "Thought for 4m24s" row that expands into the
full run, with each step's icon, prose and document badges.

Use one record per reply, not two. `CdlThinkingIndicator` renders the panel itself when
`done` is true, and `CdlMessageBubble` renders it whenever `message.thinkingTime` is set —
so either let the indicator rest, or unmount it and let the bubble carry the record.

`CdlMessageList` already wires the live half for you: pass `status="loading"` and
`thinkingSteps`, and it renders the indicator itself. Reach for the components directly
only outside that list.

Neither one draws per-step state. A step's `state` (`"running"`, `"failed"`, …) is ignored,
so a run that must show a **failed** step needs the archived `CdlThinkingIndicatorLegacy` —
the only CDL component that draws it.

```tsx
import { CdlThinkingIndicator } from "@/components/cdl/chat/cdl-thinking-indicator"
import { CdlReasoningPanel } from "@/components/cdl/chat/cdl-reasoning-panel"
import type { ThinkingStep } from "@/components/cdl/chat/cdl-chat-types"

const steps: ThinkingStep[] = [
  { text: "Searched the knowledge base", iconKind: "search", duration: "1.2s" },
  { text: "Reviewed", iconKind: "read", fileRef: "Q3_report.pdf", duration: "2.1s" },
]

// While the reply is in flight, then at rest — one component, both states.
<CdlThinkingIndicator steps={steps} done={status === "idle"} />

// Or drive the record directly, e.g. on a stored message.
<CdlReasoningPanel thinkingTime="4m24s" steps={steps} />
```

Set `description` and `documents` on a step even though the live rail drops them: the
rail holds a fixed height, and those fields surface in the record.

---

## Composition Patterns

### KPI dashboard

```tsx
<CdlPageContainer title="Dashboard" sidebar={sidebar}>
  <div className="p-6 flex flex-col gap-6">
    <div className="grid grid-cols-4 gap-4">
      <CdlKpiCard header="Revenue"  value="$124k" change={12.4}  icon={DollarSignIcon} />
      <CdlKpiCard header="Users"    value="3,210"  change={-2.1}  icon={UsersIcon} />
      <CdlKpiCard header="Orders"   value="891"    change={5.7}   icon={ShoppingBagIcon} />
      <CdlKpiCard header="Tickets"  value="34"     change={-8.0}  icon={TicketIcon} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <CdlBlockGroup>
        <CdlBlockHeader title="Revenue Over Time" />
        <CdlBlockContent className="p-4 min-h-0" style={{ height: 280 }}>
          <CdlLineChart data={revenueData} xKey="month" series={[...]} height="100%" />
        </CdlBlockContent>
      </CdlBlockGroup>
      <CdlBlockGroup>
        <CdlBlockHeader title="By Category" />
        <CdlBlockContent className="p-4 min-h-0" style={{ height: 280 }}>
          <CdlPieChart data={categoryData} nameKey="name" valueKey="value" slices={[...]} height="100%" donut />
        </CdlBlockContent>
      </CdlBlockGroup>
    </div>
  </div>
</CdlPageContainer>
```

### Full-height data table page

```tsx
<CdlPageContainer title="Users" overflow="hidden" contentClassName="p-6" sidebar={sidebar}>
  <CdlBlockGroup className="flex-1 min-h-0">
    <CdlBlockHeader title="All Users" actions={<Button size="sm">Invite</Button>} />
    <CdlBlockContent className="min-h-0 flex-1">
      <CdlDataTable data={users} columns={columns} scrollable showSearch enableSelection onSelectionChange={setSelected} />
    </CdlBlockContent>
  </CdlBlockGroup>
  <CdlActionBar open={selected.length > 0} count={selected.length} onDeselect={() => setSelected([])} onDelete={deleteSelected} />
</CdlPageContainer>
```

### Detail view with drawer

```tsx
// Page: table on the left, drawer opens on row click
<CdlDataTable data={rows} columns={columns} onRowClick={(row) => { setActive(row); setDrawerOpen(true) }} />

<CdlDrawer open={drawerOpen} onOpenChange={setDrawerOpen} width="md"
  header={<h2 className="font-semibold">{active?.name}</h2>}
  footer={<Button onClick={save}>Save</Button>}
>
  <CdlDataForm fields={fields} values={active} onChange={updateField} />
</CdlDrawer>
```

### Chat sidebar alongside content

```tsx
<CdlPageContainer overflow="hidden" sidebar={sidebar}>
  <div className="flex h-full gap-0">
    <div className="flex-1 overflow-auto p-6">
      {/* main content */}
    </div>
    <div className="w-[360px] border-l flex flex-col">
      <CdlChatPanel messages={messages} onSubmit={sendMessage} status={status} />
    </div>
  </div>
</CdlPageContainer>
```

---

## Loading states

Components with async data support a `loading` prop that shows a skeleton automatically. Pass `loading={true}` while fetching — no separate skeleton component needed.

| Component | `loading` prop |
|---|---|
| `CdlKpiCard` | ✅ |
| `CdlProgress` | ✅ |
| `CdlDataTable` | ✅ (also `skeletonRows`, `skeletonColumns`) |
| `CdlTable` | ✅ |

---

## Missing a component?

If a requirement cannot be satisfied by an installed CDL component:
1. Check if a shadcn primitive covers it (`Button`, `Input`, `Select`, `Tabs`, `Popover`, etc.)
2. Check the full CDL registry: `https://cdl-registry.compassdata.workers.dev/registry.json`
3. Flag the gap — describe what's needed, what's closest, and the simplest path forward
4. **Do not write a one-off styled div that duplicates CDL component logic** without explicit approval

<!-- Mirrored from the CDL registry (https://cdl-registry.compassdata.workers.dev/cdl-skill.md) retrieved: 2026-11-22.
Refresh: re-run the fetch in CLAUDE.md's App style standard section. -->

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react"
import "./cdl-data-table.css"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { ArrowDown, ArrowUp, ArrowsDownUp as ArrowUpDown, CaretLeft as ChevronLeft, CaretRight as ChevronRight, CaretUpDown as ChevronsDownUp, CaretUpDown as ChevronsUpDown, DotsThree, ArrowSquareOut as ExternalLink, Funnel as Filter, Plus, MagnifyingGlass as Search, X } from "@phosphor-icons/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type RowSelectionState,
  type RowData,
  type Row,
} from "@tanstack/react-table"
import { CdlSkeleton } from "@/components/cdl/display/cdl-skeleton"
import type { Icon } from "@phosphor-icons/react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CdlDataTableFilter,
  type CdlFilterCondition,
  type FieldConfig,
} from "@/components/cdl/data/cdl-data-table-filter"
import {
  CdlTableConfigurator,
  type CdlColumnConfig,
} from "@/components/cdl/data/cdl-table-configurator"

// --- Column-level edit metadata (module augmentation) ---

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Mark this column as inline-editable. */
    editable?: boolean
    /**
     * Control an editable cell shows in place. Defaults to "text". "select"
     * renders a Select over `editOptions`; "number" a number Input; any other
     * value a text Input.
     */
    editType?: "text" | "number" | "select" | "combobox"
    /** Required when editType is "select". */
    editOptions?: string[]
    /**
     * Text an empty editor shows, so an empty cell says what empty means
     * ("No maximum") instead of reading as a missing value.
     */
    editPlaceholder?: string
    /**
     * @deprecated Unused. The table no longer reads it: it was only for staged
     * cells and option labels in the click-to-edit editor, which was removed.
     * Safe to delete from call sites.
     */
    renderValue?: (value: unknown) => React.ReactNode
    /** Enable the column-level filter popover for this column. */
    filterable?: boolean
    /** Filter input style. Defaults to "text". */
    filterType?: "text" | "select" | "number"
    /** Required when filterType is "select". */
    filterOptions?: string[]
    /** Tooltip text shown when hovering the column header. A `\n` in the text starts a new line. */
    headerTooltip?: string
    /**
     * Ship this column switched off. It renders nothing until the user turns it
     * on in the Columns control, but it still appears in that list — so an
     * optional detail (a raw amount behind a variance %, an audit field) can be
     * available on demand without widening the default table. Requires
     * `columnToggle` to be anything other than `"none"`, or the user has no way
     * to reach it.
     */
    defaultHidden?: boolean
  }
}

/** One entry in a `rowMenu` dropdown. */
export interface CdlDataTableRowMenuItem {
  /** Menu item text. */
  label: string
  /** Optional leading icon (any Phosphor icon). */
  icon?: Icon
  /** Called when the item is chosen. The row's own click handler does not fire. */
  onSelect: () => void
  /** `"destructive"` colours the label and icon red, for actions like Delete. Defaults to `"default"`. */
  variant?: "default" | "destructive"
  /** Greys the item out and blocks selection. */
  disabled?: boolean
}

/** A divider between groups of `rowMenu` items. */
export interface CdlDataTableRowMenuSeparator {
  separator: true
}

/** A single staged (uncommitted) cell edit. */
export interface CdlCellEdit<TData> {
  rowId: string
  columnId: string
  value: unknown
  original: unknown
  row: TData
}

// --- Types ---

export interface CdlDataTableProps<TData> {
  /** The data array to render in the table. */
  data?: TData[]
  /** TanStack column definitions. */
  columns?: ColumnDef<TData>[]
  /** Optional filter field config. Omit to hide the filter bar. */
  filterFields?: FieldConfig[]
  /**
   * Extra toolbar content rendered in the toolbar row, between the built-in
   * filter bar and the Columns control — e.g. a button that opens a page-owned
   * filter drawer. Providing it forces the toolbar row to render (unless
   * `hideToolbar` is set), so it works on tables that use none of the built-in
   * toolbar features.
   */
  toolbarActions?: React.ReactNode
  /**
   * Column visibility toggle variant. "dropdown" (default) for simple tables,
   * "dialog" for heavy tables, "none" to hide the Columns button entirely (e.g.
   * file browsers where the columns are fixed). Pair with
   * `meta: { defaultHidden: true }` on a column to ship it switched off but
   * still reachable here — with "none" there is no way to switch it back on.
   */
  columnToggle?: "dialog" | "dropdown" | "none"
  /**
   * Visual style of the table. "plain" removes the header row background and all
   * vertical grid lines for a lighter, list-like look (file browsers, simple lists) —
   * horizontal row dividers remain. "default" keeps the full bordered grid.
   */
  variant?: "default" | "plain"
  /**
   * Vertical density of the rows. "compact" tightens header and body cell
   * heights for dense, data-heavy tables; "comfortable" adds breathing room
   * for lighter, more readable lists (and slightly wider horizontal cell
   * padding so columns feel less cramped); "default" is the standard height.
   * Affects both the header and body rows (and the loading skeleton).
   */
  density?: "compact" | "default" | "comfortable"
  /** Optional callback to add className to a row based on its data. */
  rowClassName?: (row: TData) => string
  /** Optional callback to add className to a cell based on row data and column id. */
  cellClassName?: (row: TData, columnId: string) => string
  /** Disables the row hover highlight. Useful for read-only / diff tables where hover feedback is noise. */
  disableRowHover?: boolean
  /** Show skeleton loading state. */
  loading?: boolean
  /** Number of skeleton rows in the loading state (default 5). */
  skeletonRows?: number
  /** Number of skeleton columns in the loading state (default 4). */
  skeletonColumns?: number
  /** Optional callback fired when a row is clicked. */
  onRowClick?: (row: TData) => void
  /**
   * Optional callback fired when a row is double-clicked. Combine with
   * `onRowClick` for the desktop file-browser pattern — single-click to
   * select/preview, double-click to open (note both `onRowClick` calls still
   * fire on the way to a double-click).
   */
  onRowDoubleClick?: (row: TData) => void
  /**
   * When set (with `enableSelection`), a single click anywhere on a row toggles
   * its selection checkbox — including shift-click to select a range — for a
   * file-browser model where clicking selects and double-click opens. Interactive
   * cells (the checkbox, row actions, inline edits) still handle their own clicks.
   */
  selectOnRowClick?: boolean
  /**
   * Suppress the pointer cursor on rows even when they have click handlers — e.g.
   * when a single click selects rather than navigates, so rows don't read as
   * links. Defaults to false (clickable rows show a pointer).
   */
  disableRowCursor?: boolean
  /**
   * Controls the hover "open" icon shown in the leading cell of clickable rows
   * (only relevant when `onRowClick` is set). Defaults to `true`. Pass `false`
   * to hide it entirely, or a predicate to show it per row — e.g. show it for
   * files but not folders, which still navigate on click without the icon.
   */
  showRowClickIcon?: boolean | ((row: TData) => boolean)
  /** Show a search input that filters across all columns. */
  showSearch?: boolean
  /**
   * Custom empty state when there are no rows (after filters/search). A plain
   * string gets the default centered layout with just the copy swapped; pass
   * an element (e.g. CdlEmptyState) to own the layout entirely.
   */
  emptyState?: React.ReactNode
  /** Optional accessible name for the table (rendered as a visually-hidden caption). */
  caption?: string
  /** Optional callback fired when the delete button is clicked on a row. Adds an X column as the last column. */
  onDeleteRow?: (row: TData) => void
  /**
   * Adds an ellipsis (⋯) column as the last column, styled like the `onDeleteRow`
   * column, that opens a dropdown of per-row actions. Return the items for the
   * row; add `{ separator: true }` between groups. Returning an empty array hides
   * the trigger for that row. Clicking the trigger or an item does not fire
   * `onRowClick`. If `onDeleteRow` is also set, `rowMenu` wins and the X column is
   * not rendered — add a destructive Delete item to the menu instead. It coexists
   * with `rowActions`, which sits to its left.
   */
  rowMenu?: (row: TData) => (CdlDataTableRowMenuItem | CdlDataTableRowMenuSeparator)[]
  /** Optional render function for a sticky actions column. Receives the row and returns a ReactNode. Pinned to the right of the table. */
  rowActions?: (row: TData) => React.ReactNode
  /**
   * Width of the `rowActions` column in pixels. Defaults to 40 — room for one
   * icon button. Widen it when the control carries a label, e.g. when the
   * column states the row's status as well as offering the action on it.
   */
  rowActionsWidth?: number
  /**
   * Optional header for the `rowActions` column. Defaults to none, which is
   * right for a column of icon buttons; give it a label once the column is
   * wide enough to read as a column of its own.
   */
  rowActionsHeader?: React.ReactNode
  /** Enable checkbox row selection. Adds a checkbox column as the first column. */
  enableSelection?: boolean
  /** Called whenever the selection changes. Receives the array of selected row data objects. */
  onSelectionChange?: (selectedRows: TData[]) => void
  /**
   * Return a stable string ID for each row. Used to keep selection intact when
   * rows are re-sorted or filtered. Defaults to the row index — provide a real
   * ID (e.g. `(row) => row.id`) for stable selection.
   */
  getRowId?: (row: TData, index: number) => string
  /**
   * Increment this value to programmatically clear all checkbox selections.
   * Useful when a parent action bar needs to deselect rows after a bulk action.
   */
  resetSelectionOn?: number
  /**
   * Initial sort applied on first render (uncontrolled). Seeds the header sort
   * indicator so a table can open already sorted — e.g. `[{ id: "name" }]` for
   * A→Z. Ignored when `sorting` (controlled mode) is provided.
   */
  defaultSorting?: SortingState
  /**
   * Controlled sort state. Provide together with `onSortingChange` to own
   * sorting yourself: the table shows the header indicator from this value but
   * does NOT reorder rows (manual sorting) — pass your `data` already sorted the
   * way this state describes. Use this when the built-in per-column sort isn't
   * enough, e.g. to keep a group (folders) pinned above files regardless of the
   * sort column or direction.
   */
  sorting?: SortingState
  /**
   * Called when the user toggles a column header, in controlled mode. Receives a
   * TanStack updater — resolve it against your current sort state, then re-sort
   * your data to match. Only used when `sorting` is also provided.
   */
  onSortingChange?: OnChangeFn<SortingState>
  /**
   * Returns the children of a row. Passing this prop turns on drill-down: each
   * row whose result is non-empty gets a chevron in the leading cell, and
   * children are rendered inline with progressive indentation.
   */
  getSubRows?: (row: TData) => TData[] | undefined
  /**
   * Initial expansion state for drill-down. Pass `true` to expand everything,
   * or a record keyed by row id (matching `getRowId`) to expand specific rows.
   * Defaults to all rows collapsed.
   */
  defaultExpanded?: true | Record<string, boolean>
  /**
   * Increment this value to programmatically apply `defaultExpanded` to the
   * current expanded state, collapsing or expanding all rows without remounting
   * the table. Mirrors the `resetSelectionOn` pattern.
   */
  resetExpansionOn?: number
  /**
   * Called whenever the set of staged (uncommitted) cell edits changes.
   * Receives the total count and the full change list — use this to drive a
   * CdlActionBar with Save / Discard controls.
   * Columns opt in to inline editing via `meta: { editable: true }`. Editable cells take
   * spreadsheet keys: Enter commits and moves down (Shift+Enter up), Tab and Shift+Tab move
   * across editable cells (row controls between cells stay in the Tab order), Escape
   * restores the value from when the cell took focus.
   */
  onPendingEditsChange?: (count: number, changes: CdlCellEdit<TData>[]) => void
  /**
   * Increment this value to programmatically clear all staged cell edits.
   * Mirrors the `resetSelectionOn` pattern — increment after a save or discard.
   */
  clearEditsOn?: number
  /**
   * When provided, renders a full-width "+ Add New Row" button. Clicking it fires
   * this callback — the parent handles creating the new row.
   */
  onAddRow?: () => void
  /** Label for the add-row button. Defaults to "Add New Row". */
  addRowLabel?: string
  /**
   * Controls where the add-row button is rendered.
   * - `"inline"` (default): button is a table row immediately after the last data row.
   * - `"sticky"`: button sticks to the bottom of the scroll container, always visible.
   */
  addRowPosition?: "inline" | "sticky"
  /** Hides the toolbar (search, filters, collapse/expand button) entirely. */
  hideToolbar?: boolean
  /**
   * Extra controls rendered inside the toolbar row — after the built-in
   * search/filter controls, before the right-aligned expand/collapse button.
   * Setting it forces the toolbar to render. Size custom controls to the
   * toolbar's h-7 rhythm (e.g. `size="xs"` buttons, `!h-7` select triggers)
   * so they line up with the built-ins.
   */
  toolbarContent?: React.ReactNode
  /**
   * Renders a totals row under the body, built from each column's `footer` in
   * its `ColumnDef`. Use it where a figure stated elsewhere on the page is the
   * sum of a column, so the reader can tie the two without adding up rows.
   * Columns with no `footer` render empty. Pinned columns (the select checkbox,
   * `pinFirstColumn`, `rowActions`, `rowMenu`, `onDeleteRow`) stay pinned in the
   * totals row too. The row sits directly under the last body row: setting
   * `showFooter` implies `noFill`, so there is no filler row between them. The
   * row is not sticky vertically.
   */
  showFooter?: boolean
  /** Suppresses the filler row that extends column grid lines to the bottom of the container. */
  noFill?: boolean
  /**
   * Locks column widths using table-layout: fixed, preventing shifts when rows
   * expand or collapse. Only columns that explicitly set a `size` are pinned to
   * that width; columns without a `size` are left `auto` and share the remaining
   * space equally. So to cap one column and let the rest distribute across the
   * full width, give just that column a `size` and leave the others unset.
   */
  fixedLayout?: boolean
  /**
   * Enables vertical scrolling within the component's own scroll container.
   * The header row stays fixed via `position: sticky` while body rows scroll.
   * The component fills whatever height its parent provides — use a flex/grid
   * layout or `h-full` on a height-constrained ancestor to bound the height.
   */
  scrollable?: boolean
  /**
   * Pins the first data column to the left so it stays visible while the table
   * scrolls horizontally. The header, body, and filler cells of that column all
   * become `position: sticky`. When `enableSelection` is on, the pinned column
   * sits just to the right of the checkbox column. Pairs naturally with wide
   * tables; combine with `scrollable` when the table also scrolls vertically.
   */
  pinFirstColumn?: boolean
  /**
   * Forces the horizontal scrollbar to remain permanently visible instead of
   * appearing only on hover. Useful for wide tables where users need to know
   * at a glance that more columns exist off-screen.
   */
  alwaysShowScrollbar?: boolean
  /**
   * Enables pagination, rendering this many rows per page with controls below
   * the table. Omit to render all rows (default). Ignored when `getSubRows`
   * (drill-down) is set — pagination only applies to flat tables. The table
   * sizes to its content while paginated, as if `noFill` were set.
   */
  pageSize?: number
  /**
   * Page-size choices shown in a "Rows per page" selector next to the
   * pagination controls. Only used when `pageSize` is also set.
   */
  pageSizeOptions?: number[]
}

// --- Inline cell editor ---

/** Marks every in-place editor so the keyboard handlers can find their neighbours in the DOM. */
const CELL_EDITOR_ATTR = "data-cdl-cell-editor"

function focusCellEditor(el: HTMLElement) {
  el.focus()
  if (el instanceof HTMLInputElement) el.select()
}

/**
 * The editor in the same column, one row down (`step` 1) or up (`step` -1).
 * It walks the rendered rows, so it follows the visible row model: sorting,
 * filtering and the current page are already applied. Rows without that
 * column's editor (a filler row, a group row) are skipped.
 */
function adjacentRowEditor(from: HTMLElement, step: 1 | -1): HTMLElement | null {
  const column = from.getAttribute("data-edit-col")
  let row = from.closest("tr")?.[step === 1 ? "nextElementSibling" : "previousElementSibling"] ?? null
  while (row) {
    const found = row.querySelector<HTMLElement>(`[${CELL_EDITOR_ATTR}][data-edit-col="${CSS.escape(column ?? "")}"]`)
    if (found) return found
    row = row[step === 1 ? "nextElementSibling" : "previousElementSibling"]
  }
  return null
}

/**
 * The next (`step` 1) or previous (`step` -1) editor in reading order: left to
 * right, then down to the next row. Columns with no editor never appear, so
 * they are skipped. Returns null at the end of the table, where Tab must be
 * left to the browser.
 */
function adjacentCellEditor(from: HTMLElement, step: 1 | -1): HTMLElement | null {
  const table = from.closest("table")
  if (!table) return null
  const all = Array.from(table.querySelectorAll<HTMLElement>(`[${CELL_EDITOR_ATTR}]`))
  const at = all.indexOf(from)
  return at === -1 ? null : (all[at + step] ?? null)
}

const TABBABLE =
  'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * The editor Tab should jump to, or null when the browser should take the key.
 * The jump is only right when no other control sits between the two editors in
 * DOM order. Otherwise it would skip the row's checkbox, menu, delete button,
 * row actions, or a link in a read-only cell, and a keyboard reader could never
 * reach them. With a control in between, the native Tab reaches it, and the next
 * Tab from there carries on.
 */
function tabTargetEditor(from: HTMLElement, step: 1 | -1): HTMLElement | null {
  const target = adjacentCellEditor(from, step)
  const table = from.closest("table")
  if (!target || !table) return null
  const tabbable = Array.from(table.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("tabindex") !== "-1" &&
      (el.checkVisibility ? el.checkVisibility() : true),
  )
  const a = tabbable.indexOf(from)
  const b = tabbable.indexOf(target)
  if (a === -1 || b === -1) return null
  return Math.abs(a - b) === 1 ? target : null
}

/**
 * The editor an editable cell always shows, with no click needed to reveal it.
 * It commits on change for a select and on blur for an Input, and stages the
 * edit through `commitEdit`. Keys, in the spreadsheet way:
 * - Enter commits and moves to the same column in the next row (Shift+Enter
 *   moves up). On the last row it commits and stays.
 * - Tab and Shift+Tab move to the next or previous editable cell and wrap to the
 *   next or previous row. Controls between two editors (a row checkbox, menu or
 *   delete button, a link) stay in the Tab order: Tab reaches them first. At either
 *   end of the table the browser takes the key.
 * - Escape puts back the value the cell had when it took focus.
 * A select keeps its native keys: Enter opens it, and nothing is taken while its
 * list is open. Only Tab moves on from a select.
 */
function PersistentCellEditor({
  value,
  columnId,
  editType = "text",
  editOptions,
  placeholder,
  staged,
  onCommit,
}: {
  value: string
  /** The column this cell belongs to. Enter uses it to find the cell below. */
  columnId: string
  editType?: "text" | "number" | "select" | "combobox"
  editOptions?: string[]
  placeholder?: string
  staged: boolean
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  // The value the cell held when it took focus, for Escape to restore.
  const valueOnFocus = useRef(value)
  // Take the row's value when it changes underneath the editor (a save, a
  // discard), adjusting state during render rather than in an effect.
  const [seenValue, setSeenValue] = useState(value)
  if (value !== seenValue) {
    setSeenValue(value)
    setDraft(value)
  }

  // A changed value keeps its amber mark while focused: the focus ring turns amber too,
  // instead of the default grey one replacing it.
  const stagedRing = staged
    ? "ring-1 ring-amber-400 dark:ring-amber-500 focus-visible:ring-[3px] focus-visible:ring-amber-400/50 dark:focus-visible:ring-amber-500/50 focus-visible:border-amber-400 dark:focus-visible:border-amber-500"
    : ""

  if (editType === "select" && editOptions) {
    // A row may hold a key where the options are labels, as a status column
    // often does. Match loosely so the trigger shows the row's own value.
    const selected =
      editOptions.find((o) => o === value) ??
      editOptions.find((o) => o.toLowerCase() === value.toLowerCase())
    return (
      <Select value={selected} onValueChange={onCommit}>
        <SelectTrigger
          size="sm"
          {...{ [CELL_EDITOR_ATTR]: "", "data-edit-col": columnId }}
          className={`w-full ${stagedRing}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            // The list is open: its own keys (arrows, Enter, Escape, type-ahead) apply.
            if (e.currentTarget.getAttribute("aria-expanded") === "true") return
            if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey) return
            const next = tabTargetEditor(e.currentTarget, e.shiftKey ? -1 : 1)
            if (!next) return
            e.preventDefault()
            focusCellEditor(next)
          }}
          title={staged ? "Staged, not yet saved" : undefined}
        >
          <SelectValue placeholder={value} />
        </SelectTrigger>
        <SelectContent>
          {editOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      type={editType === "number" ? "number" : "text"}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      {...{ [CELL_EDITOR_ATTR]: "", "data-edit-col": columnId }}
      onFocus={(e) => {
        valueOnFocus.current = value
        e.currentTarget.select()
      }}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        // Leave an input method's composition (CJK, accents) alone.
        // Safari fires compositionend before the confirming keydown, so isComposing
        // is already false there; keyCode 229 still marks that key.
        if (e.nativeEvent.isComposing || e.keyCode === 229) return
        if (e.key === "Escape") {
          setDraft(valueOnFocus.current)
          return
        }
        if (e.altKey || e.ctrlKey || e.metaKey) return
        if (e.key === "Enter") {
          e.preventDefault()
          onCommit(draft)
          // The blur that follows commits again with the same value, which stages nothing new.
          const next = adjacentRowEditor(e.currentTarget, e.shiftKey ? -1 : 1)
          if (next) focusCellEditor(next)
          return
        }
        if (e.key === "Tab") {
          const next = tabTargetEditor(e.currentTarget, e.shiftKey ? -1 : 1)
          if (!next) return
          e.preventDefault()
          onCommit(draft)
          focusCellEditor(next)
        }
      }}
      title={staged ? "Staged, not yet saved" : undefined}
      className={`h-8 w-full min-w-0 text-sm ${stagedRing}`}
    />
  )
}

// --- Filter logic ---

function flattenForSearch(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(flattenForSearch)
      .join(" ")
  }
  return String(value)
}

function getColumnId<TData>(col: ColumnDef<TData>): string {
  return col.id ?? (col as { accessorKey?: string }).accessorKey ?? ""
}

// Cubic-bezier ease-out. Typed as a 4-tuple so it satisfies motion's `Easing` —
// a bare array literal widens to number[], which motion's types reject.
const EASE_OUT: [number, number, number, number] = [0.25, 1, 0.5, 1]

const DELETE_COLUMN_ID = "__delete__"
const DELETE_COLUMN_WIDTH = 40
const DELETE_COLUMN_STYLE: React.CSSProperties = {
  width: DELETE_COLUMN_WIDTH,
  minWidth: DELETE_COLUMN_WIDTH,
  maxWidth: DELETE_COLUMN_WIDTH,
  position: "sticky",
  right: 0,
  zIndex: 1,
}

const ACTIONS_COLUMN_ID = "__actions__"
const ACTIONS_COLUMN_WIDTH = 40

const SELECT_COLUMN_ID = "__select__"
const SELECT_COLUMN_WIDTH = 40
const SELECT_COLUMN_STYLE: React.CSSProperties = {
  width: SELECT_COLUMN_WIDTH,
  minWidth: SELECT_COLUMN_WIDTH,
  maxWidth: SELECT_COLUMN_WIDTH,
  position: "sticky",
  left: 0,
  zIndex: 1,
}

// Left separator for the leftmost right-pinned (actions/delete) column. Rendered as
// an inset box-shadow rather than a CSS border because the table uses border-collapse,
// where a border on a position:sticky cell paints at the column's natural grid position
// (so it only lines up once scrolled fully right) — a box-shadow sticks to the cell box,
// so the separator is always visible during horizontal scroll.
const STICKY_RIGHT_LEFT_BORDER = "inset 1px 0 0 var(--border)"

// --- Sort icon helper ---

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ArrowUp className="size-3" />
  if (isSorted === "desc") return <ArrowDown className="size-3" />
  return <ArrowUpDown className="size-3 opacity-40" />
}

// --- Column filter helpers ---

type ColumnFilterValue =
  | string
  | string[]
  | { min?: string; max?: string }
  | null

function applyColumnFilter(
  value: unknown,
  filterValue: ColumnFilterValue,
  filterType: "text" | "select" | "number",
): boolean {
  if (filterValue == null) return true
  if (filterType === "text") {
    const q = String(filterValue).trim()
    return q === "" || String(value ?? "").toLowerCase().includes(q.toLowerCase())
  }
  if (filterType === "select") {
    const selected = filterValue as string[]
    return selected.length === 0 || selected.includes(String(value ?? ""))
  }
  if (filterType === "number") {
    const { min, max } = filterValue as { min?: string; max?: string }
    const num = Number(value)
    if (min && min.trim() !== "" && !isNaN(Number(min)) && num < Number(min)) return false
    if (max && max.trim() !== "" && !isNaN(Number(max)) && num > Number(max)) return false
    return true
  }
  return true
}

function isColumnFilterActive(
  filterValue: ColumnFilterValue,
  filterType: "text" | "select" | "number",
): boolean {
  if (filterValue == null) return false
  if (filterType === "text") return String(filterValue).trim() !== ""
  if (filterType === "select") return (filterValue as string[]).length > 0
  if (filterType === "number") {
    const { min, max } = filterValue as { min?: string; max?: string }
    return (min ?? "").trim() !== "" || (max ?? "").trim() !== ""
  }
  return false
}

// --- Column filter popover ---

interface ColumnFilterButtonProps {
  columnId: string
  filterType: "text" | "select" | "number"
  filterOptions?: string[]
  filterValue: ColumnFilterValue
  onChange: (columnId: string, value: ColumnFilterValue) => void
}

function ColumnFilterButton({
  columnId,
  filterType,
  filterOptions,
  filterValue,
  onChange,
}: ColumnFilterButtonProps) {
  const isActive = isColumnFilterActive(filterValue, filterType)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<ColumnFilterValue>(filterValue)

  function handleOpenChange(next: boolean) {
    if (next) setDraft(filterValue)
    setOpen(next)
  }

  function handleApply() {
    onChange(columnId, draft)
    setOpen(false)
  }

  function handleClear() {
    setDraft(null)
    onChange(columnId, null)
    setOpen(false)
  }

  const draftActive = isColumnFilterActive(draft, filterType)

  return (
    <div onClick={(e) => e.stopPropagation()}>
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={[
            "flex items-center justify-center size-4 rounded cursor-pointer",
            isActive ? "text-foreground" : "opacity-40 hover:opacity-100",
          ].join(" ")}
          aria-label="Filter column"
          aria-pressed={isActive}
        >
          <Filter className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-52" align="end" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
        {filterType === "text" && (
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">Filter</p>
              {draftActive && (
                <button type="button" onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  Clear
                </button>
              )}
            </div>
            <Input
              autoFocus
              value={String(draft ?? "")}
              onChange={(e) => setDraft(e.target.value || null)}
              placeholder="Search…"
              className="h-7 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleApply() }}
            />
            <Button size="xs" className="w-full" onClick={handleApply}>Apply</Button>
          </div>
        )}

        {filterType === "select" && (
          <div className="flex flex-col gap-1 p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm">Filter</p>
              {draftActive && (
                <button type="button" onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  Clear
                </button>
              )}
            </div>
            {(filterOptions ?? []).map((opt) => {
              const selected = ((draft as string[]) ?? []).includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm py-0.5">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const current = (draft as string[]) ?? []
                      const next = checked ? [...current, opt] : current.filter((v) => v !== opt)
                      setDraft(next.length ? next : null)
                    }}
                  />
                  {opt}
                </label>
              )
            })}
            <Button size="xs" className="w-full mt-2" onClick={handleApply}>Apply</Button>
          </div>
        )}

        {filterType === "number" && (
          <div className="flex flex-col gap-2 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">Filter range</p>
              {draftActive && (
                <button type="button" onClick={handleClear} className="text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                type="number"
                value={(draft as { min?: string; max?: string })?.min ?? ""}
                onChange={(e) => setDraft({ ...((draft as object) ?? {}), min: e.target.value })}
                placeholder="Min"
                className="h-7 text-sm"
              />
              <span className="text-xs text-muted-foreground shrink-0">–</span>
              <Input
                type="number"
                value={(draft as { min?: string; max?: string })?.max ?? ""}
                onChange={(e) => setDraft({ ...((draft as object) ?? {}), max: e.target.value })}
                placeholder="Max"
                className="h-7 text-sm"
              />
            </div>
            <Button size="xs" className="w-full" onClick={handleApply}>Apply</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
    </div>
  )
}

function evaluateFilter<TData>(row: TData, filter: CdlFilterCondition): boolean {
  const value = String((row as Record<string, unknown>)[filter.field])
  switch (filter.operator) {
    case "is":
      return filter.values.includes(value)
    case "is not":
      return !filter.values.includes(value)
    case "is any of":
      return filter.values.includes(value)
    case "is above":
      return parseFloat(value) > parseFloat(filter.values[0] ?? "")
    case "is below":
      return parseFloat(value) < parseFloat(filter.values[0] ?? "")
    case "is between": {
      const num = parseFloat(value)
      return num >= parseFloat(filter.values[0] ?? "") && num <= parseFloat(filter.values[1] ?? "")
    }
    default:
      return true
  }
}

function applyFilters<TData>(data: TData[], filters: CdlFilterCondition[]): TData[] {
  const activeFilters = filters.filter((f) =>
    f.operator === "is between"
      ? f.values[0]?.trim() !== "" && f.values[1]?.trim() !== ""
      : f.values.length > 0 && f.values[0]?.trim() !== ""
  )
  const [firstFilter, ...restFilters] = activeFilters
  if (!firstFilter) return data

  return data.filter((row) => {
    let result = evaluateFilter(row, firstFilter)
    for (const filter of restFilters) {
      const filterResult = evaluateFilter(row, filter)
      if (filter.logicOperator === "or") {
        result = result || filterResult
      } else {
        result = result && filterResult
      }
    }
    return result
  })
}

// --- Component ---

export function CdlDataTable<TData>({
  data = [] as TData[],
  columns = [] as ColumnDef<TData>[],
  filterFields,
  toolbarActions,
  columnToggle,
  variant = "default",
  density = "default",
  rowClassName,
  cellClassName,
  disableRowHover,
  loading,
  skeletonRows = 5,
  skeletonColumns = 4,
  onRowClick,
  onRowDoubleClick,
  selectOnRowClick,
  disableRowCursor,
  showRowClickIcon = true,
  showSearch,
  emptyState,
  caption,
  onDeleteRow,
  rowMenu,
  rowActions,
  rowActionsWidth,
  rowActionsHeader,
  enableSelection,
  onSelectionChange,
  getRowId,
  resetSelectionOn,
  defaultSorting,
  sorting: sortingProp,
  onSortingChange: onSortingChangeProp,
  getSubRows,
  defaultExpanded,
  resetExpansionOn,
  onPendingEditsChange,
  clearEditsOn,
  onAddRow,
  addRowLabel = "Add New Row",
  addRowPosition = "inline",
  hideToolbar,
  toolbarContent,
  noFill,
  showFooter = false,
  fixedLayout,
  scrollable,
  pinFirstColumn,
  alwaysShowScrollbar,
  pageSize,
  pageSizeOptions,
}: CdlDataTableProps<TData>) {
  // Sorting can be uncontrolled (internal state, optionally seeded by
  // `defaultSorting`) or controlled (parent owns `sorting` + `onSortingChange`).
  // In controlled mode the table only renders the header indicator and emits
  // toggles — it does not reorder rows (see `manualSorting` below); the parent
  // supplies pre-sorted `data`, which lets it do things TanStack can't, like
  // pinning a group of rows above the rest regardless of sort direction.
  const [internalSorting, setInternalSorting] = useState<SortingState>(defaultSorting ?? [])
  const isSortingControlled = sortingProp !== undefined
  const sorting = isSortingControlled ? sortingProp : internalSorting
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (isSortingControlled) onSortingChangeProp?.(updater)
    else setInternalSorting(updater)
  }
  const [filters, setFilters] = useState<CdlFilterCondition[]>([])
  const [columnFilterValues, setColumnFilterValues] = useState<Map<string, ColumnFilterValue>>(new Map())

  function setColumnFilter(columnId: string, value: ColumnFilterValue) {
    setColumnFilterValues((prev) => {
      const next = new Map(prev)
      if (value == null) {
        next.delete(columnId)
      } else {
        next.set(columnId, value)
      }
      return next
    })
  }
  const [search, setSearch] = useState("")
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  // Anchor for shift-click range selection: the id of the last row toggled by a
  // plain/cmd click. Shift-clicking another checkbox selects everything between
  // this anchor and the clicked row, in the currently displayed order. A ref, not
  // state, because it's only read synchronously inside the click handler.
  const selectionAnchorRef = useRef<string | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? 10,
  })
  const [expanded, setExpanded] = useState<ExpandedState>(
    defaultExpanded === true ? true : (defaultExpanded ?? {})
  )
  const defaultExpandedRef = useRef(defaultExpanded)
  useLayoutEffect(() => { defaultExpandedRef.current = defaultExpanded })
  useEffect(() => {
    if (resetExpansionOn === undefined) return
    setExpanded(defaultExpandedRef.current === true ? true : (defaultExpandedRef.current ?? {}))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetExpansionOn])
  const drillDownEnabled = !!getSubRows
  const paginationEnabled = pageSize !== undefined && !drillDownEnabled
  const reducedMotion = useReducedMotion()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [selectColScrolled, setSelectColScrolled] = useState(false)
  const [xScroll, setXScroll] = useState({ left: 0, scrollWidth: 1, clientWidth: 1 })
  const xContainerRef = useRef<HTMLElement | null>(null)

  // Inline editing state
  const [pendingEdits, setPendingEdits] = useState<
    Map<string, { value: unknown; original: unknown; row: TData }>
  >(new Map())

  useEffect(() => {
    setRowSelection({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSelectionOn])

  useEffect(() => {
    if (clearEditsOn === undefined) return
    setPendingEdits(new Map())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearEditsOn])

  // Keep a stable ref to the callback so the effect below only re-runs when
  // pendingEdits actually changes, not when the parent re-renders.
  const onPendingEditsChangeRef = useRef(onPendingEditsChange)
  useLayoutEffect(() => { onPendingEditsChangeRef.current = onPendingEditsChange })

  useEffect(() => {
    if (!onPendingEditsChangeRef.current) return
    const changes: CdlCellEdit<TData>[] = Array.from(pendingEdits.entries()).map(([key, entry]) => {
      const sepIdx = key.indexOf(":::")
      return {
        rowId: key.slice(0, sepIdx),
        columnId: key.slice(sepIdx + 3),
        value: entry.value,
        original: entry.original,
        row: entry.row,
      }
    })
    onPendingEditsChangeRef.current(pendingEdits.size, changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingEdits])

  useEffect(() => {
    // Tracked for both the sticky checkbox column and a pinned first column —
    // either one shows a separator/lift shadow once scrolled off the left edge.
    if ((!enableSelection && !pinFirstColumn) || loading) return
    const wrapper = scrollContainerRef.current
    if (!wrapper) return
    // shadcn <Table> renders its own [data-slot="table-container"] with overflow-x-auto —
    // that's the real scroll element, not our outer div.
    const scroller = wrapper.querySelector<HTMLElement>('[data-slot="table-container"]')
    if (!scroller) return
    const update = () => setSelectColScrolled(scroller.scrollLeft > 0)
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(scroller)
    const inner = scroller.querySelector("table")
    if (inner) ro.observe(inner)
    return () => {
      scroller.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [enableSelection, pinFirstColumn, loading])

  // A `scrollable` table locks vertical overscroll (no bounce, no chaining) only
  // while it really overflows vertically. A table with nothing to scroll must let
  // the wheel reach the page, so the lock is a data attribute that tracks overflow.
  // It is set on the DOM node directly: no state, no re-render, no size change.
  useEffect(() => {
    if (!scrollable || loading) return
    const root = scrollContainerRef.current
    if (!root || typeof ResizeObserver === "undefined") return
    const container = root.querySelector<HTMLElement>('[data-slot="table-container"]')
    const update = () => {
      // 1px of slack: border-collapse and subpixel rounding can leave a stray pixel.
      const overflows =
        root.scrollHeight > root.clientHeight + 1 ||
        (!!container && container.scrollHeight > container.clientHeight + 1)
      root.toggleAttribute("data-y-overflow", overflows)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(root)
    if (container) ro.observe(container)
    const table = container?.querySelector("table")
    if (table) ro.observe(table)
    Array.from(root.children).forEach((child) => ro.observe(child))
    return () => {
      ro.disconnect()
      root.removeAttribute("data-y-overflow")
    }
  }, [scrollable, loading])

  useEffect(() => {
    if (!alwaysShowScrollbar || loading) return
    const wrapper = scrollContainerRef.current
    if (!wrapper) return
    const container = wrapper.querySelector<HTMLElement>('[data-slot="table-container"]')
    if (!container) return
    xContainerRef.current = container
    const update = () => setXScroll({
      left: container.scrollLeft,
      scrollWidth: container.scrollWidth,
      clientWidth: container.clientWidth,
    })
    update()
    container.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(container)
    const innerTable = container.querySelector('table')
    if (innerTable) ro.observe(innerTable)
    return () => {
      container.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [alwaysShowScrollbar, loading])

  // Columns start visible unless they opt out with `meta: { defaultHidden: true }`.
  // A hidden column still appears in the Columns control, so it stays reachable —
  // it just doesn't cost width until someone asks for it.
  const defaultColumnConfig: CdlColumnConfig[] = useMemo(
    () =>
      columns.map((col) => {
        const id = getColumnId(col)
        return {
          id,
          label:
            typeof col.header === "string"
              ? col.header
              : id.charAt(0).toUpperCase() + id.slice(1),
          visible: !col.meta?.defaultHidden,
        }
      }),
    [columns],
  )

  // Columns the consumer explicitly gave a `size` to. Read from the raw column
  // defs (not react-table's, which merges a default size of 150 into every
  // column) so that under `fixedLayout` only these are width-locked — the rest
  // stay `auto` and share the remaining width equally.
  const explicitlySizedIds = useMemo(
    () => new Set(columns.filter((c) => c.size !== undefined).map(getColumnId)),
    [columns],
  )

  // Stable signature so user reorder/visibility state survives parent re-renders
  // but resets when the column set actually changes.
  const columnSignature = useMemo(
    () => columns.map(getColumnId).join("|"),
    [columns],
  )

  const [columnConfig, setColumnConfig] = useState<CdlColumnConfig[]>(defaultColumnConfig)
  const [signatureSeen, setSignatureSeen] = useState(columnSignature)
  if (signatureSeen !== columnSignature) {
    setSignatureSeen(columnSignature)
    setColumnConfig(defaultColumnConfig)
  }

  const filteredData = useMemo(() => {
    let result = applyFilters(data, filters)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        flattenForSearch(row).toLowerCase().includes(q)
      )
    }
    if (columnFilterValues.size > 0) {
      result = result.filter((row) => {
        for (const [columnId, filterValue] of columnFilterValues.entries()) {
          const colDef = columns.find((c) => getColumnId(c) === columnId)
          const filterType = colDef?.meta?.filterType ?? "text"
          const value = (row as Record<string, unknown>)[columnId]
          if (!applyColumnFilter(value, filterValue, filterType)) return false
        }
        return true
      })
    }
    return result
  }, [data, filters, search, columnFilterValues, columns])

  // Reset to the first page whenever the filtered set or the page size changes,
  // so users don't land on a now-empty page.
  useEffect(() => {
    setPagination((p) => ({ pageIndex: 0, pageSize: pageSize ?? p.pageSize }))
  }, [filteredData, pageSize])

  // The trailing column: the X delete button, or the ellipsis menu when `rowMenu`
  // is set (rowMenu wins). Both share one column id, so pinning, divider and
  // header treatment are identical.
  // The callbacks live in refs and the column is memoised on whether each is set,
  // not on its identity: a consumer passes `rowMenu` inline, and a new column
  // definition on every parent render would remount the trigger and close an
  // open menu (and drop focus after a selection).
  const onDeleteRowRef = useRef(onDeleteRow)
  onDeleteRowRef.current = onDeleteRow
  const rowMenuRef = useRef(rowMenu)
  rowMenuRef.current = rowMenu
  const hasDeleteHandler = !!onDeleteRow
  const hasRowMenu = !!rowMenu
  const hasTrailingColumn = hasDeleteHandler || hasRowMenu
  const deleteColumn: ColumnDef<TData> | null = useMemo(() => {
    if (!hasDeleteHandler && !hasRowMenu) return null
    return {
      id: DELETE_COLUMN_ID,
      header: () => null,
      enableSorting: false,
      cell: ({ row }) => {
        if (hasRowMenu) {
          const items = rowMenuRef.current?.(row.original) ?? []
          if (items.length === 0) return null
          return (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted data-[state=open]:bg-muted data-[state=open]:text-foreground cursor-pointer"
                    aria-label="Row actions"
                  >
                    <DotsThree weight="bold" className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  {items.map((item, i) =>
                    "separator" in item ? (
                      <DropdownMenuSeparator key={i} />
                    ) : (
                      <DropdownMenuItem
                        key={i}
                        variant={item.variant === "destructive" ? "destructive" : "default"}
                        disabled={item.disabled}
                        className="cursor-pointer text-sm"
                        onSelect={() => item.onSelect()}
                      >
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
        return (
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteRowRef.current?.(row.original)
              }}
              className="flex items-center justify-center size-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
              aria-label="Delete row"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      },
    }
  }, [hasDeleteHandler, hasRowMenu])

  const actionsWidth = rowActionsWidth ?? ACTIONS_COLUMN_WIDTH
  const actionsColumnStyle: React.CSSProperties = {
    width: actionsWidth,
    minWidth: actionsWidth,
    maxWidth: actionsWidth,
    position: "sticky",
    right: hasTrailingColumn ? DELETE_COLUMN_WIDTH : 0,
    zIndex: 1,
  }

  /**
   * The actions column's HEADER cell, which pins only when it has a label to
   * pin. An unlabelled actions header is an empty opaque block, and pinning it
   * means the headers to its left slide underneath and disappear for the width
   * of the column while the table is scrolled. Nothing is being kept in view by
   * that, so it stays in the flow and scrolls away with its own column. The
   * body cells stay pinned either way — those hold the controls.
   */
  const actionsHeaderStyle: React.CSSProperties =
    rowActionsHeader != null
      ? actionsColumnStyle
      : { width: actionsWidth, minWidth: actionsWidth, maxWidth: actionsWidth }

  const actionsColumn: ColumnDef<TData> | null = useMemo(() => {
    if (!rowActions) return null
    return {
      id: ACTIONS_COLUMN_ID,
      header: () => rowActionsHeader ?? null,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {rowActions(row.original)}
        </div>
      ),
    }
  }, [rowActions, rowActionsHeader])

  const selectColumn: ColumnDef<TData> | null = useMemo(() => {
    if (!enableSelection) return null
    return {
      id: SELECT_COLUMN_ID,
      enableSorting: false,
      header: ({ table }) => (
        <div className="flex items-center justify-center w-full">
          <Checkbox
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
            className="cursor-pointer transition-colors duration-100"
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row, table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={row.getToggleSelectedHandler()}
            onClick={(e) => {
              e.stopPropagation()
              const anchorId = selectionAnchorRef.current
              // Shift+click: select the range between the anchor and this row,
              // in the order rows are currently displayed (respects sort/filter/
              // pagination). preventDefault stops Radix's own toggle so the range
              // update below is the only selection change.
              if (e.shiftKey && anchorId && anchorId !== row.id) {
                const rows = table.getRowModel().rows
                const anchorIndex = rows.findIndex((r) => r.id === anchorId)
                const currentIndex = rows.findIndex((r) => r.id === row.id)
                if (anchorIndex !== -1 && currentIndex !== -1) {
                  e.preventDefault()
                  const [start, end] =
                    anchorIndex < currentIndex
                      ? [anchorIndex, currentIndex]
                      : [currentIndex, anchorIndex]
                  const nextChecked = !row.getIsSelected()
                  setRowSelection((prev) => {
                    const next = { ...prev }
                    for (const r of rows.slice(start, end + 1)) {
                      if (!r.getCanSelect()) continue
                      if (nextChecked) next[r.id] = true
                      else delete next[r.id]
                    }
                    return next
                  })
                }
              }
              // Plain click and cmd/ctrl+click both fall through to Radix's toggle
              // (a checkbox already toggles independently). Either way, this row
              // becomes the new anchor for the next shift-click.
              selectionAnchorRef.current = row.id
            }}
            className="cursor-pointer transition-colors duration-100"
            aria-label="Select row"
          />
        </div>
      ),
    }
  }, [enableSelection])

  const orderedColumns = useMemo(() => {
    const visibleIds = columnConfig.filter((c) => c.visible).map((c) => c.id)
    const visible = visibleIds
      .map((id) => columns.find((col) => getColumnId(col) === id))
      .filter(Boolean) as ColumnDef<TData>[]
    const withActions = actionsColumn ? [...visible, actionsColumn] : visible
    const withDelete = deleteColumn ? [...withActions, deleteColumn] : withActions
    return selectColumn ? [selectColumn, ...withDelete] : withDelete
  }, [columnConfig, columns, deleteColumn, actionsColumn, selectColumn])

  // Pinned first column: the leftmost real data column (skipping the select /
  // actions / delete utility columns). It becomes position:sticky at a left
  // offset equal to the checkbox column width when selection is on, else 0.
  const pinnedFirstColId = useMemo(() => {
    if (!pinFirstColumn) return null
    const col = orderedColumns.find((c) => {
      const id = getColumnId(c)
      return id !== SELECT_COLUMN_ID && id !== ACTIONS_COLUMN_ID && id !== DELETE_COLUMN_ID
    })
    return col ? getColumnId(col) : null
  }, [pinFirstColumn, orderedColumns])
  const pinnedFirstColLeft = enableSelection ? SELECT_COLUMN_WIDTH : 0
  // Right-edge separator for the pinned column — always a 1px divider (so it
  // reads as a normal grid line when at rest), gaining a soft lift shadow once
  // the table is scrolled off its left edge. A box-shadow rather than a border
  // because border-collapse repaints a sticky cell's border at its natural grid
  // position (only aligning when fully scrolled), while a box-shadow tracks the
  // cell box — see the sticky-right separator note above.
  const pinnedFirstColShadow = selectColScrolled
    ? "6px 0 8px -6px color-mix(in srgb, var(--foreground) 22%, transparent), inset -1px 0 0 var(--border)"
    : "inset -1px 0 0 var(--border)"

  // While a search is active, auto-expand every row so descendant matches are
  // actually visible (otherwise the parent stays visible but the matching child
  // is hidden behind a collapsed chevron, which reads as a broken search).
  const effectiveExpanded: ExpandedState =
    drillDownEnabled && search.trim() ? true : expanded

  const table = useReactTable({
    data: filteredData,
    columns: orderedColumns,
    state: { sorting, rowSelection, expanded: effectiveExpanded, pagination },
    onSortingChange: handleSortingChange,
    // In controlled mode the parent owns row order (it passes pre-sorted data),
    // so TanStack must not re-sort — it only tracks state for the indicator.
    manualSorting: isSortingControlled,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    onPaginationChange: setPagination,
    enableRowSelection: enableSelection ?? false,
    enableSubRowSelection: drillDownEnabled,
    getSubRows: drillDownEnabled ? (row) => getSubRows!(row) : undefined,
    getRowId: getRowId ?? ((_row, index) => String(index)),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: drillDownEnabled ? getExpandedRowModel() : undefined,
    getPaginationRowModel: paginationEnabled ? getPaginationRowModel() : undefined,
  })

  useEffect(() => {
    onSelectionChange?.(table.getSelectedRowModel().rows.map((r) => r.original))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection])

  // Single-click on a row: optionally toggle its selection (file-browser model),
  // then fire the consumer's onRowClick. Selection mirrors the checkbox column —
  // plain click toggles, shift-click selects the displayed range from the anchor.
  const activateRow = (row: Row<TData>, e: React.MouseEvent) => {
    if (selectOnRowClick && enableSelection && row.getCanSelect()) {
      const anchorId = selectionAnchorRef.current
      if (e.shiftKey && anchorId && anchorId !== row.id) {
        const rows = table.getRowModel().rows
        const anchorIndex = rows.findIndex((r) => r.id === anchorId)
        const currentIndex = rows.findIndex((r) => r.id === row.id)
        if (anchorIndex !== -1 && currentIndex !== -1) {
          const [start, end] =
            anchorIndex < currentIndex ? [anchorIndex, currentIndex] : [currentIndex, anchorIndex]
          const nextChecked = !row.getIsSelected()
          setRowSelection((prev) => {
            const next = { ...prev }
            for (const r of rows.slice(start, end + 1)) {
              if (!r.getCanSelect()) continue
              if (nextChecked) next[r.id] = true
              else delete next[r.id]
            }
            return next
          })
        }
      } else {
        row.toggleSelected()
      }
      selectionAnchorRef.current = row.id
    }
    onRowClick?.(row.original)
  }

  // --- Inline editing helpers ---

  function getEditKey(rowId: string, columnId: string): string {
    return `${rowId}:::${columnId}`
  }

  function getCellDisplayValue(rowId: string, columnId: string, rowOriginal: TData): string {
    const pending = pendingEdits.get(getEditKey(rowId, columnId))
    if (pending !== undefined) return String(pending.value)
    return String((rowOriginal as Record<string, unknown>)[columnId] ?? "")
  }

  function commitEdit(
    rowId: string,
    columnId: string,
    rawValue: string,
    editType: "text" | "number" | "select" | "combobox" | undefined,
    rowOriginal: TData,
  ) {
    // An empty number input is empty, not zero: Number("") is 0, which would
    // stage a change on every empty cell the reader tabs through.
    const parsed =
      editType === "number"
        ? rawValue.trim() === ""
          ? null
          : isNaN(Number(rawValue)) ? rawValue : Number(rawValue)
        : rawValue
    const original = (rowOriginal as Record<string, unknown>)[columnId]
    const key = getEditKey(rowId, columnId)
    // An empty cell holds null or undefined while its editor holds "". Read
    // both as empty, so leaving an empty cell alone stages nothing.
    const asText = (v: unknown) => (v === null || v === undefined ? "" : String(v))
    setPendingEdits((prev) => {
      const next = new Map(prev)
      if (asText(parsed) === asText(original)) {
        next.delete(key)
      } else {
        next.set(key, { value: parsed, original, row: rowOriginal })
      }
      return next
    })
  }

  function handleXScrollbarDrag(e: React.PointerEvent<HTMLDivElement>) {
    const container = xContainerRef.current
    if (!container) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const startX = e.clientX
    const startLeft = container.scrollLeft
    const trackWidth = e.currentTarget.parentElement!.getBoundingClientRect().width
    const maxScroll = container.scrollWidth - container.clientWidth
    const scrollRatio = container.scrollWidth / trackWidth
    const onMove = (ev: PointerEvent) => {
      container.scrollLeft = Math.max(0, Math.min(maxScroll, startLeft + (ev.clientX - startX) * scrollRatio))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // --- Render ---

  const activeCount = filters.filter((f) => f.values.length > 0).length + columnFilterValues.size
  const showToolbar = !!(filterFields || toolbarActions != null || (columnToggle && columnToggle !== "none") || showSearch || drillDownEnabled || toolbarContent)
  // "plain" variant: no header fill, no vertical grid lines — only horizontal dividers.
  const plain = variant === "plain"
  // Row density → header/body cell heights. In a border-collapsed table these act as
  // minimums, so taller values simply give the rows more vertical breathing room.
  const headerHeightClass = density === "compact" ? "h-8" : density === "comfortable" ? "h-11" : "h-9"
  const rowHeightClass = density === "compact" ? "h-9" : density === "comfortable" ? "h-14" : "h-10"
  // Comfortable density also widens horizontal cell padding (base is px-2) so
  // columns feel less cramped. Applied to every non-select header and body cell;
  // the edge overrides (first:pl-3, last cell's pr-4) still win where they apply.
  const cellPadClass = density === "comfortable" ? "px-3" : ""
  // Paginated tables size to their content (like noFill) so the pagination
  // footer sits naturally below the (variable-height) page of rows.
  const effectiveNoFill = noFill || paginationEnabled || showFooter
  const totalFilteredRows = table.getFilteredRowModel().rows.length
  const pageRangeStart = totalFilteredRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageRangeEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalFilteredRows)
  // Whether the custom horizontal scrollbar is currently visible (only when content
  // actually overflows). Drives the footer pinning below.
  const showXScrollbar = !!alwaysShowScrollbar && xScroll.scrollWidth > xScroll.clientWidth

  if (loading) {
    const colWidths = ["w-[30%]", "w-[25%]", "w-[25%]", "w-[20%]", "w-[15%]", "w-[10%]"]
    return (
      <div className="flex flex-col overflow-x-auto overscroll-x-none">
        {showToolbar && (
          <div className="flex items-center gap-1.5 border-b p-2">
            <CdlSkeleton variant="rectangle" className="h-7 w-20 rounded" />
            <CdlSkeleton variant="rectangle" className="h-7 w-7 rounded" />
          </div>
        )}
        <Table style={{ minWidth: "100%" }}>
          <TableHeader>
            <TableRow>
              {enableSelection && (
                <TableHead style={SELECT_COLUMN_STYLE} className={plain ? `${headerHeightClass} px-0 border-r-0` : `${headerHeightClass} bg-muted px-0 border-r-0`}>
                  <div className="flex items-center justify-center w-full">
                    <CdlSkeleton variant="rectangle" className="size-4 rounded-[4px]" />
                  </div>
                </TableHead>
              )}
              {Array.from({ length: skeletonColumns }).map((_, i) => (
                <TableHead key={i} className={plain ? `${headerHeightClass} border-r-0 first:pl-3` : `${headerHeightClass} bg-muted first:pl-3`}>
                  <CdlSkeleton variant="line" className="h-2.5 w-16" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, rowIdx) => (
              <TableRow key={rowIdx}>
                {enableSelection && (
                  <TableCell style={SELECT_COLUMN_STYLE} className={`${rowHeightClass} px-0 border-r-0 bg-surface-default`}>
                    <div className="flex items-center justify-center w-full">
                      <CdlSkeleton variant="rectangle" className="size-4 rounded-[4px]" />
                    </div>
                  </TableCell>
                )}
                {Array.from({ length: skeletonColumns }).map((_, colIdx) => (
                  <TableCell key={colIdx} className={plain ? `${rowHeightClass} border-r-0 first:pl-3` : `${rowHeightClass} first:pl-3`}>
                    <CdlSkeleton variant="line" className={`h-3 ${colWidths[colIdx % colWidths.length]}`} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className={`cdl-data-table-scroll flex flex-col overflow-x-auto${scrollable ? " cdl-data-table-scroll-y overflow-y-auto h-full" : ""}${!scrollable && (!onAddRow || addRowPosition === "sticky") && !effectiveNoFill ? " h-full cdl-table-fill-height" : ""}${alwaysShowScrollbar ? " cdl-table-always-scroll" : ""}`}>
      {/* Toolbar */}
      {showToolbar && !hideToolbar && (
        <div className="flex items-center gap-1.5 border-b p-2">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="h-7 pl-7 text-sm w-48"
              />
            </div>
          )}
          {filterFields && (
            <CdlDataTableFilter
              fields={filterFields}
              filters={filters}
              onChange={setFilters}
            />
          )}
          {toolbarActions}
          {columnToggle !== "none" && (
            <CdlTableConfigurator
              columns={columnConfig}
              onChange={setColumnConfig}
              variant={columnToggle}
            />
          )}
          {toolbarContent}
          {activeCount > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              {filteredData.length} of {data.length} results
            </span>
          )}
          {drillDownEnabled && (
            <Button
              variant="outline"
              size="xs"
              className="ml-auto"
              onClick={() => table.toggleAllRowsExpanded()}
              // Search auto-expands the tree, so a manual toggle while search is
              // active would set state that's masked by the override — disable
              // until the user clears the search.
              disabled={!!search.trim()}
            >
              {table.getIsAllRowsExpanded() ? (
                <>
                  <ChevronsDownUp className="size-3.5" />
                  Collapse all
                </>
              ) : (
                <>
                  <ChevronsUpDown className="size-3.5" />
                  Expand all
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <Table style={{ minWidth: '100%', ...(fixedLayout ? { tableLayout: "fixed" as const } : {}), ...(!scrollable && (!onAddRow || addRowPosition === "sticky") && !effectiveNoFill ? { height: '100%' } : {}) }}>
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <TableHeader className={scrollable ? "sticky top-0 z-[2]" : undefined}>
          {table.getHeaderGroups().map((headerGroup) => {
            const lastDataHeaderId = (hasTrailingColumn || rowActions)
              ? headerGroup.headers.filter(h => h.column.id !== DELETE_COLUMN_ID && h.column.id !== ACTIONS_COLUMN_ID && h.column.id !== SELECT_COLUMN_ID).slice(-1)[0]?.id
              : null
            return (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const isDeleteCol = header.column.id === DELETE_COLUMN_ID
                const isActionsCol = header.column.id === ACTIONS_COLUMN_ID
                const isSelectCol = header.column.id === SELECT_COLUMN_ID
                const isPinnedFirst = header.column.id === pinnedFirstColId
                const isLastDataHeader = !!lastDataHeaderId && header.id === lastDataHeaderId
                const isLeftmostStickyRight = isActionsCol || (isDeleteCol && !rowActions)
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      ...(isDeleteCol
                        ? DELETE_COLUMN_STYLE
                        : isActionsCol
                          ? actionsHeaderStyle
                          : isSelectCol
                            ? SELECT_COLUMN_STYLE
                            : fixedLayout && explicitlySizedIds.has(header.column.id)
                              ? { width: header.getSize(), minWidth: header.getSize() }
                              : {}),
                      // The select/delete/actions columns set their own `position: sticky` for
                      // horizontal (left/right) pinning. That establishes an independent
                      // sticky context, so they don't inherit the `<thead>`'s `top: 0`
                      // stickiness — without this they scroll away vertically while the
                      // rest of the header row stays pinned.
                      ...((isDeleteCol || isSelectCol || (isActionsCol && rowActionsHeader != null)) && scrollable
                        ? { top: 0, zIndex: 2 }
                        : {}),
                      // A labelled actions header carries the same inset left separator as
                      // its body cells, so the column reads as a column from the header
                      // down. An unlabelled one stays borderless: it is an empty block.
                      ...(isSelectCol
                        ? {
                            transition: "box-shadow 150ms ease",
                            // Suppressed when a pinned column follows: the divider then
                            // belongs to the right edge of the pinned column, not between
                            // the checkbox and the pinned column.
                            boxShadow: selectColScrolled && !pinFirstColumn ? "inset -1px 0 0 var(--border)" : "none",
                          }
                        : isActionsCol && rowActionsHeader != null && !plain
                          ? { boxShadow: `${STICKY_RIGHT_LEFT_BORDER}${scrollable ? ", 0 1px 0 0 var(--color-border)" : ""}` }
                          : scrollable && !isPinnedFirst
                            ? { boxShadow: "0 1px 0 0 var(--color-border)" }
                            : {}),
                      // Pinned first column: sticky-left, lifted above the sibling header
                      // cells, carrying both the header's bottom border and its own right
                      // divider/lift shadow.
                      ...(isPinnedFirst
                        ? {
                            position: "sticky",
                            left: pinnedFirstColLeft,
                            zIndex: scrollable ? 3 : 1,
                            transition: "box-shadow 150ms ease",
                            ...(scrollable ? { top: 0 } : {}),
                            boxShadow: scrollable
                              ? `${pinnedFirstColShadow}, 0 1px 0 0 var(--color-border)`
                              : pinnedFirstColShadow,
                          }
                        : {}),
                    }}
                    className={[
                      `${headerHeightClass} select-none text-sm text-foreground`,
                      canSort && "cursor-pointer transition-colors hover:text-muted-foreground",
                      // Plain headers still need an opaque background — when `scrollable`,
                      // the sticky header row must mask the rows scrolling beneath it.
                      plain ? "bg-background border-r-0" : "bg-muted",
                      // Pinned column carries its divider via box-shadow (set in style),
                      // so its native border-r is dropped to avoid a detached grid line
                      // under border-collapse when scrolled.
                      isPinnedFirst && "border-r-0",
                      !isSelectCol && "first:pl-3",
                      !isSelectCol && cellPadClass,
                      // Drop the right border on the last data column when a sticky-right
                      // separator column follows it, so its border-r doesn't double up with
                      // that column's left box-shadow separator.
                      isLastDataHeader && "pr-4 border-r-0",
                      (isDeleteCol || isActionsCol) && !isLeftmostStickyRight && !plain && "border-l border-border",
                      // Left edge of the leftmost right-pinned column uses an always-on inset box-shadow (set in style) instead of a border, so it stays visible during horizontal scroll under border-collapse.
                      // Previously a left-edge fade gradient — replaced by the border per design. May revert.
                      // isLeftmostStickyRight && "before:content-[''] before:absolute before:right-full before:top-0 before:bottom-0 before:w-4 before:pointer-events-none before:bg-[linear-gradient(to_right,transparent,var(--color-muted))]",
                      isSelectCol && "px-0 border-r-0",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : canSort
                            ? "none"
                            : undefined
                    }
                    // Sortable headers toggle sorting when the whole cell is clicked
                    // (the arrow indicator is display-only now). Keyboard users can
                    // focus the header and press Enter/Space. The filter button, if
                    // present, stops propagation so it never triggers a sort.
                    onClick={canSort ? (e) => header.column.getToggleSortingHandler()?.(e) : undefined}
                    onKeyDown={
                      canSort
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }
                        : undefined
                    }
                    tabIndex={canSort ? 0 : undefined}
                  >
                    <div className={["flex items-center gap-1", isSelectCol && "w-full"].filter(Boolean).join(" ")}>
                      <div className={["min-w-0", isSelectCol && "flex-1"].filter(Boolean).join(" ")}>
                        {header.isPlaceholder ? null : (
                          header.column.columnDef.meta?.headerTooltip ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-default underline decoration-dotted decoration-muted-foreground/60 underline-offset-2">
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                  </span>
                                </TooltipTrigger>
                                {/* whitespace-pre-line: a \n in the tooltip text starts a new line. */}
                                <TooltipContent side="top" collisionPadding={8} className="max-w-56 whitespace-pre-line">
                                  {header.column.columnDef.meta.headerTooltip}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </div>
                      {(canSort || (header.column.columnDef.meta?.filterable && !isDeleteCol && !isSelectCol)) && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          {/* Filter first, so it sits beside the label rather than
                              beyond the sort arrow's reserved (usually empty) slot. */}
                          {header.column.columnDef.meta?.filterable && !isDeleteCol && !isSelectCol && (
                            <ColumnFilterButton
                              columnId={header.column.id}
                              filterType={header.column.columnDef.meta?.filterType ?? "text"}
                              filterOptions={header.column.columnDef.meta?.filterOptions}
                              filterValue={columnFilterValues.get(header.column.id) ?? null}
                              onChange={setColumnFilter}
                            />
                          )}
                          {canSort && (
                            // Always rendered so its slot is permanently reserved — the
                            // arrow only fades in once the column is actively sorted, so
                            // sorting never shifts the header layout.
                            <span
                              className={[
                                "flex items-center justify-center size-4 text-foreground transition-opacity",
                                header.column.getIsSorted() ? "opacity-100" : "opacity-0",
                              ].join(" ")}
                              aria-hidden="true"
                            >
                              <SortIcon isSorted={header.column.getIsSorted()} />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
            )
          })}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            (() => {
            const rowElements = table.getRowModel().rows.map((row) => {
              const isSubRow = drillDownEnabled && row.depth > 0
              const lastDataCellId = (hasTrailingColumn || rowActions)
                ? row.getVisibleCells().filter(c => c.column.id !== SELECT_COLUMN_ID && c.column.id !== DELETE_COLUMN_ID && c.column.id !== ACTIONS_COLUMN_ID).slice(-1)[0]?.id
                : null
              const motionProps = !reducedMotion && isSubRow ? {
                initial: { opacity: 0, y: -6 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -4, transition: { duration: 0.1, ease: EASE_OUT } },
                transition: { duration: 0.18, ease: EASE_OUT, delay: Math.min(row.index * 0.02, 0.1) },
              } : {}
              const rowClassNames = [
                disableRowHover
                  ? "data-[state=selected]:bg-surface-selected border-b transition-colors"
                  : "hover:bg-surface-hover data-[state=selected]:bg-surface-selected border-b transition-colors",
                "group transition-colors duration-100",
                row.getIsSelected() && (disableRowHover ? "bg-surface-selected" : "bg-surface-selected hover:bg-surface-selected-hover"),
                rowClassName?.(row.original),
                !disableRowCursor && (onRowClick || onRowDoubleClick || selectOnRowClick) && "cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")
              const cells = row.getVisibleCells().map((cell, cellIndex) => {
                  const isDeleteCol = cell.column.id === DELETE_COLUMN_ID
                  const isActionsCol = cell.column.id === ACTIONS_COLUMN_ID
                  const isSelectCol = cell.column.id === SELECT_COLUMN_ID
                  const isPinnedFirst = cell.column.id === pinnedFirstColId
                  const isLastDataCell = !!lastDataCellId && cell.id === lastDataCellId
                  const isSelected = row.getIsSelected()
                  const isLeftmostStickyRight = isActionsCol || (isDeleteCol && !rowActions)
                  const isLeadingCell =
                    !isSelectCol && !isDeleteCol && !isActionsCol && cellIndex === (enableSelection ? 1 : 0)
                  const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext())

                  // Inline editing
                  const colMeta = cell.column.columnDef.meta
                  const isEditable = !!colMeta?.editable && !isDeleteCol && !isActionsCol && !isSelectCol
                  const editKey = getEditKey(row.id, cell.column.id)
                  const pendingEntry = pendingEdits.get(editKey)

                  const baseContent: React.ReactNode = cellContent

                  // Drill-down: prefix the leading cell with chevron + per-depth indent.
                  // Each level adds 20px on top of the cell's base pl-3 so text columns
                  // stay vertically aligned with the (un-padded) header lane.
                  let inner: React.ReactNode = baseContent
                  if (drillDownEnabled && isLeadingCell) {
                    const indentPx = row.depth * 20
                    inner = (
                      <div
                        className="flex items-center gap-2 min-w-0"
                        style={indentPx > 0 ? { paddingLeft: indentPx } : undefined}
                      >
                        {row.getCanExpand() ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              row.getToggleExpandedHandler()()
                            }}
                            className="flex size-3.5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                            aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
                            aria-expanded={row.getIsExpanded()}
                          >
                            <motion.div
                              animate={{ rotate: row.getIsExpanded() ? 90 : 0 }}
                              transition={{ duration: reducedMotion ? 0 : 0.2, ease: EASE_OUT }}
                              className="flex"
                            >
                              <ChevronRight className="size-3.5" />
                            </motion.div>
                          </button>
                        ) : (
                          <span className="size-3.5 shrink-0" aria-hidden />
                        )}
                        {baseContent}
                      </div>
                    )
                  }
                  const rowClickIconVisible =
                    typeof showRowClickIcon === "function"
                      ? showRowClickIcon(row.original)
                      : showRowClickIcon
                  if (onRowClick && isLeadingCell && rowClickIconVisible) {
                    inner = (
                      <div className="flex items-center justify-between gap-2">
                        {inner}
                        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    )
                  }

                  // The cell IS the editor: an editable cell always shows its control.
                  if (isEditable) {
                    inner = (
                      <PersistentCellEditor
                        value={getCellDisplayValue(row.id, cell.column.id, row.original)}
                        columnId={cell.column.id}
                        editType={colMeta?.editType}
                        editOptions={colMeta?.editOptions}
                        placeholder={colMeta?.editPlaceholder}
                        staged={!!pendingEntry}
                        onCommit={(value) =>
                          commitEdit(row.id, cell.column.id, value, colMeta?.editType, row.original)
                        }
                      />
                    )
                  }

                  return (
                    <TableCell
                      key={cell.id}
                      style={{
                        ...(isDeleteCol
                          ? DELETE_COLUMN_STYLE
                          : isActionsCol
                            ? actionsColumnStyle
                            : isSelectCol
                              ? SELECT_COLUMN_STYLE
                              : fixedLayout && explicitlySizedIds.has(cell.column.id)
                                ? { width: cell.column.getSize(), minWidth: cell.column.getSize() }
                                : {}),
                        ...(isSelectCol
                          ? {
                              // Include background-color here so the sticky checkbox cell
                              // fades on the same 100ms clock as the row (transition-colors
                              // duration-100). Its background is painted on the cell directly
                              // (it can't be transparent — it's sticky), so without this it
                              // would snap instantly while the rest of the row fades, leaving
                              // the checkbox column visibly out of sync on select. Set inline
                              // rather than via a class because this inline `transition` would
                              // otherwise override any transition-colors utility class.
                              transition: "box-shadow 150ms ease, background-color 100ms ease",
                              boxShadow: selectColScrolled && !pinFirstColumn ? "inset -1px 0 0 var(--border)" : "none",
                            }
                          : isLeftmostStickyRight && !plain
                            ? { boxShadow: STICKY_RIGHT_LEFT_BORDER }
                            : {}),
                      // Pinned first column: sticky-left with its own right divider/lift
                      // shadow. Its opaque background (set via className) masks the cells
                      // scrolling beneath it.
                      ...(isPinnedFirst
                        ? {
                            position: "sticky",
                            left: pinnedFirstColLeft,
                            zIndex: 1,
                            transition: "box-shadow 150ms ease, background-color 100ms ease",
                            boxShadow: pinnedFirstColShadow,
                          }
                        : {}),
                      }}
                      className={[
                        `${rowHeightClass} text-sm`,
                        plain && "border-r-0",
                        !isSelectCol && "first:pl-3",
                        !isSelectCol && cellPadClass,
                        // Drop the right border on the last data column when a sticky-right
                        // separator column follows it, so its border-r doesn't double up with
                        // that column's left box-shadow separator.
                        isLastDataCell && "pr-4 border-r-0",
                        // Pinned first column: opaque, row-state-matching background so the
                        // cells scrolling beneath stay masked; native border-r dropped in
                        // favor of the box-shadow divider (set in style).
                        isPinnedFirst && [
                          "border-r-0 transition-colors duration-100",
                          isSelected
                            ? "bg-surface-selected group-hover:bg-surface-selected-hover"
                            : "bg-surface-default group-hover:bg-surface-hover",
                        ].filter(Boolean).join(" "),
                        (isDeleteCol || isActionsCol) && [
                          !isLeftmostStickyRight && !plain && "border-l border-border",
                          // Fade on the same 100ms clock as the row — these sticky columns
                          // paint their own opaque background, so without this they'd snap
                          // instantly and lag the rest of the row's fade on select.
                          "transition-colors duration-100",
                          isSelected
                            ? "bg-surface-selected group-hover:bg-surface-selected-hover"
                            : "bg-surface-default group-hover:bg-surface-hover",
                        ].filter(Boolean).join(" "),
                        // Left edge of the leftmost right-pinned column uses an always-on inset box-shadow (set in style) instead of a border, so it stays visible during horizontal scroll under border-collapse.
                        // Previously a left-edge fade gradient — replaced by the border per design. May revert.
                        // isLeftmostStickyRight && [
                        //   isSelected
                        //     ? "before:bg-[linear-gradient(to_right,transparent,var(--color-surface-selected))] group-hover:before:bg-[linear-gradient(to_right,transparent,var(--color-surface-selected-hover))]"
                        //     : "before:bg-[linear-gradient(to_right,transparent,var(--color-surface-default))] group-hover:before:bg-[linear-gradient(to_right,transparent,var(--color-surface-hover))]",
                        //   "before:content-[''] before:absolute before:right-full before:top-0 before:bottom-0 before:w-4 before:pointer-events-none",
                        // ].join(" "),
                        isSelectCol && [
                          "px-0 border-r-0",
                          isSelected
                            ? "bg-surface-selected group-hover:bg-surface-selected-hover"
                            : "bg-surface-default group-hover:bg-surface-hover",
                        ].filter(Boolean).join(" "),
                        cellClassName?.(row.original, cell.column.id),
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {inner}
                    </TableCell>
                  )
                })

              if (drillDownEnabled) {
                return (
                  <motion.tr
                    data-slot="table-row"
                    key={row.id}
                    {...motionProps}
                    data-selected={row.getIsSelected() || undefined}
                    className={rowClassNames}
                    onClick={(e) => activateRow(row, e)}
                    onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  >
                    {cells}
                  </motion.tr>
                )
              }

              return (
                <tr
                  data-slot="table-row"
                  key={row.id}
                  data-selected={row.getIsSelected() || undefined}
                  className={rowClassNames}
                  onClick={(e) => activateRow(row, e)}
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                >
                  {cells}
                </tr>
              )
            })
            return drillDownEnabled ? (
              <AnimatePresence initial={false}>{rowElements}</AnimatePresence>
            ) : (
              rowElements
            )
            })()
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(orderedColumns.length, 1)} className="p-0">
                {emptyState == null || typeof emptyState === "string" ? (
                  <p className="h-24 flex items-center justify-center text-sm text-muted-foreground">
                    {emptyState ?? "No results match your filters."}
                  </p>
                ) : (
                  emptyState
                )}
              </TableCell>
            </TableRow>
          )}
          {/* Inline add-row button — table row immediately after the last data row */}
          {onAddRow && addRowPosition === "inline" && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={Math.max(orderedColumns.length, 1)} className="p-2 h-auto">
                <button
                  type="button"
                  onClick={onAddRow}
                  className="flex items-center justify-center gap-1.5 w-full h-7 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Plus className="size-3" />
                  {addRowLabel}
                </button>
              </TableCell>
            </TableRow>
          )}
          {/* Skipped while paginated: the pagination bar's own top border closes the
              table, so the last row drops its border and the two do not stack. */}
          {/* Zero-height sentinel — keeps TableBody's [last-child]:border-0 off
              the last data row. It must hold a real (zero-height) cell: under
              border-collapse, Chrome only paints the last data row's bottom
              border when a neighboring cell exists below it. */}
          {effectiveNoFill && !paginationEnabled && (
            <tr aria-hidden="true" role="presentation" className="h-0">
              <td colSpan={Math.max(orderedColumns.length, 1)} className="h-0 border-0 p-0" />
            </tr>
          )}
          {/* Filler row — extends vertical column lines to fill container height */}
          {(!onAddRow || addRowPosition === "sticky") && !effectiveNoFill && (
            <tr className="h-full" aria-hidden="true" role="presentation">
              {(() => {
                // The sticky-right separator columns (actions, delete) are always trailing,
                // so the last data column sits just before them. Drop its right border so it
                // doesn't double up with the separator's left box-shadow.
                const trailingStickyCount = (rowActions ? 1 : 0) + (hasTrailingColumn ? 1 : 0)
                const lastDataColIdx = trailingStickyCount > 0
                  ? orderedColumns.length - 1 - trailingStickyCount
                  : -1
                return orderedColumns.map((col, i) => {
                const isDeleteCol = col.id === DELETE_COLUMN_ID
                const isActionsCol = col.id === ACTIONS_COLUMN_ID
                const isSelectCol = col.id === SELECT_COLUMN_ID
                const isPinnedFirst = getColumnId(col) === pinnedFirstColId
                const isLeftmostStickyRight = isActionsCol || (isDeleteCol && !rowActions)
                const isLastDataFiller = i === lastDataColIdx
                return (
                  <td
                    key={i}
                    style={{
                      ...(isDeleteCol
                        ? DELETE_COLUMN_STYLE
                        : isActionsCol
                          ? actionsColumnStyle
                          : isSelectCol
                            ? SELECT_COLUMN_STYLE
                            : {}),
                      ...(isSelectCol
                        ? {
                            transition: "background-color 100ms ease, box-shadow 150ms ease",
                            boxShadow: selectColScrolled && !pinFirstColumn ? "inset -1px 0 0 var(--border)" : "none",
                          }
                        : isLeftmostStickyRight && !plain
                          ? { boxShadow: STICKY_RIGHT_LEFT_BORDER }
                          : {}),
                      // Pinned first column: keep the filler cell sticky so the pinned
                      // column's divider extends cleanly to the bottom of the container.
                      ...(isPinnedFirst
                        ? {
                            position: "sticky",
                            left: pinnedFirstColLeft,
                            zIndex: 1,
                            transition: "box-shadow 150ms ease",
                            boxShadow: pinnedFirstColShadow,
                          }
                        : {}),
                    }}
                    className={[
                      plain ? "p-0 border-r-0" : "border-r border-border last:border-r-0 p-0",
                      isLastDataFiller && "border-r-0",
                      (isDeleteCol || isActionsCol) &&
                        (isLeftmostStickyRight || plain ? "bg-surface-default" : "bg-surface-default border-l"),
                      // Left edge of the leftmost right-pinned column uses an always-on inset box-shadow (set in style) instead of a border, so it stays visible during horizontal scroll under border-collapse.
                      // Previously a left-edge fade gradient — replaced by the border per design. May revert.
                      // isLeftmostStickyRight && "before:content-[''] before:absolute before:right-full before:top-0 before:bottom-0 before:w-4 before:pointer-events-none before:bg-[linear-gradient(to_right,transparent,var(--color-surface-default))]",
                      isSelectCol && "bg-surface-default border-r-0",
                      isPinnedFirst && "bg-surface-default border-r-0",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )
              })
              })()}
            </tr>
          )}
        </TableBody>
        {showFooter && (
          <tfoot className="border-t border-border">
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id} className="hover:bg-transparent">
                {footerGroup.headers.map((header) => {
                  const colId = header.column.id
                  const isDeleteCol = colId === DELETE_COLUMN_ID
                  const isActionsCol = colId === ACTIONS_COLUMN_ID
                  const isSelectCol = colId === SELECT_COLUMN_ID
                  const isPinnedFirst = colId === pinnedFirstColId
                  const isLeftmostStickyRight = isActionsCol || (isDeleteCol && !rowActions)
                  // Same per-column pinning as the body cells, so the totals stay
                  // under their columns when the table scrolls sideways. The fill is
                  // opaque: a pinned cell must hide what slides beneath it.
                  return (
                    <TableCell
                      key={header.id}
                      style={{
                        ...(isDeleteCol
                          ? DELETE_COLUMN_STYLE
                          : isActionsCol
                            ? actionsColumnStyle
                            : isSelectCol
                              ? SELECT_COLUMN_STYLE
                              : {}),
                        ...(isSelectCol
                          ? { boxShadow: selectColScrolled && !pinFirstColumn ? "inset -1px 0 0 var(--border)" : "none" }
                          : isLeftmostStickyRight && !plain
                            ? { boxShadow: STICKY_RIGHT_LEFT_BORDER }
                            : {}),
                        ...(isPinnedFirst
                          ? { position: "sticky", left: pinnedFirstColLeft, zIndex: 1, boxShadow: pinnedFirstColShadow }
                          : {}),
                      }}
                      className={["py-2 text-sm font-medium", plain ? "bg-background border-r-0" : "bg-muted", !isSelectCol && "first:pl-3", isPinnedFirst && "border-r-0"]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.footer, header.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </tfoot>
        )}
      </Table>
      {/* Custom always-visible horizontal scrollbar. When the table scrolls, it pins to
          the bottom (mt-auto) as a flush, full-width strip with a top border, sitting
          directly on top of the pagination footer. */}
      {showXScrollbar && (
        <div
          className={[
            "shrink-0 h-2.5 px-1 flex items-center border-t border-border bg-surface-default",
            scrollable && "mt-auto",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="relative w-full h-1.5">
            <div
              className="absolute top-0 h-full rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 cursor-grab active:cursor-grabbing transition-colors select-none"
              style={{
                width: `${(xScroll.clientWidth / xScroll.scrollWidth) * 100}%`,
                left: `${(xScroll.left / (xScroll.scrollWidth - xScroll.clientWidth)) * (1 - xScroll.clientWidth / xScroll.scrollWidth) * 100}%`,
              }}
              onPointerDown={handleXScrollbarDrag}
            />
          </div>
        </div>
      )}
      {/* Pagination footer */}
      {paginationEnabled && (
        <div
          className={[
            "flex flex-wrap items-center justify-between gap-3 border-t px-3 py-2",
            scrollable && "sticky bottom-0 bg-surface-default",
            // Pin to the bottom of the scroll area. When the horizontal scrollbar is
            // shown it already carries mt-auto, so the footer follows it directly.
            scrollable && !showXScrollbar && "mt-auto",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p className="text-sm text-muted-foreground">
            {totalFilteredRows === 0
              ? "0 results"
              : `Showing ${pageRangeStart}–${pageRangeEnd} of ${totalFilteredRows}`}
          </p>
          <div className="flex items-center gap-2">
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page</span>
                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) =>
                    setPagination({ pageIndex: 0, pageSize: Number(value) })
                  }
                >
                  <SelectTrigger size="sm" className="w-[4.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <div className="w-px h-4 bg-border shrink-0" />
            )}
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-1 text-sm text-muted-foreground whitespace-nowrap">
                    Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                    aria-label="Go to next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
      {/* Sticky add-row button — always visible at the bottom of the scroll container */}
      {onAddRow && addRowPosition === "sticky" && (
        <div className="sticky bottom-0 border-t border-border bg-surface-default">
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center justify-center gap-1.5 w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Plus className="size-3" />
            {addRowLabel}
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DotsSixVertical as GripVertical, Plus, X, Columns as Columns3, MagnifyingGlass as Search, Check, Minus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CdlDialog,
  CdlDialogTrigger,
  CdlDialogContent,
  CdlDialogHeader,
  CdlDialogBody,
  CdlDialogFooter,
} from "@/components/cdl/feedback/cdl-dialog"

// --- Types ---

export interface CdlColumnConfig {
  id: string
  label: string
  visible: boolean
}

interface CdlTableConfiguratorPanelProps {
  columns: CdlColumnConfig[]
  onApply: (columns: CdlColumnConfig[]) => void
  onReset?: () => void
  /** Set false to hide the drag handles and disable column reordering. @default true */
  reorderable?: boolean
}

interface CdlTableConfiguratorProps {
  columns: CdlColumnConfig[]
  onChange: (columns: CdlColumnConfig[]) => void
  defaultOpen?: boolean
  /** "dialog" for heavy tables with many columns, "dropdown" for simple tables. */
  variant?: "dialog" | "dropdown"
  /** Set false to hide the drag handles and disable column reordering. @default true */
  reorderable?: boolean
}

// --- Sortable Visible Row ---

function SortableVisibleRow({
  column,
  onHide,
  reorderable,
}: {
  column: CdlColumnConfig
  onHide: (id: string) => void
  reorderable: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: transform ? CSS.Transform.toString({ ...transform, x: 0 }) : undefined,
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${isDragging ? "z-10 bg-muted/50" : ""}`}
    >
      {reorderable && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <span className="flex-1 text-sm text-foreground">{column.label}</span>
      <button
        onClick={() => onHide(column.id)}
        className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// --- Panel (standalone, no dialog wrapper) ---

export function CdlTableConfiguratorPanel({
  columns,
  onApply,
  onReset,
  reorderable = true,
}: CdlTableConfiguratorPanelProps) {
  const [draft, setDraft] = useState<CdlColumnConfig[]>(columns)
  const [search, setSearch] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const query = search.toLowerCase()
  const hiddenColumns = draft.filter((c) => !c.visible && c.label.toLowerCase().includes(query))
  const visibleColumns = draft.filter((c) => c.visible && c.label.toLowerCase().includes(query))

  function handleShow(id: string) {
    setDraft((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: true } : c))
    )
  }

  function handleHide(id: string) {
    setDraft((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: false } : c))
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setDraft((prev) => {
        const visible = prev.filter((c) => c.visible)
        const hidden = prev.filter((c) => !c.visible)
        const oldIndex = visible.findIndex((c) => c.id === active.id)
        const newIndex = visible.findIndex((c) => c.id === over.id)
        const reordered = arrayMove(visible, oldIndex, newIndex)
        return [...reordered, ...hidden]
      })
    }
  }

  function handleReset() {
    setDraft(columns)
    setSearch("")
    onReset?.()
  }

  return (
    <>
      <CdlDialogBody className="p-0">
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground/50" />
            <Input
              placeholder="Search columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-auto border-0 rounded-none p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-sm"
            />
          </div>
        </div>
        <div className="flex h-100">
          {/* Hidden panel */}
          <div className="flex flex-col flex-1 border-r">
            <div className="px-4 py-2.5 border-b">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Hidden
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {hiddenColumns.map((column) => (
                <button
                  key={column.id}
                  onClick={() => handleShow(column.id)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 border-b text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Plus className="size-3.5" />
                  {column.label}
                </button>
              ))}
              {hiddenColumns.length === 0 && (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                  All columns visible
                </div>
              )}
            </div>
          </div>

          {/* Visible panel */}
          <div className="flex flex-col flex-1 overflow-x-hidden">
            <div className="px-4 py-2.5 border-b">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Visible
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={visibleColumns.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleColumns.map((column) => (
                    <SortableVisibleRow
                      key={column.id}
                      column={column}
                      onHide={handleHide}
                      reorderable={reorderable}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {visibleColumns.length === 0 && (
                <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                  No columns visible
                </div>
              )}
            </div>
          </div>
        </div>
      </CdlDialogBody>
      <CdlDialogFooter>
        <Button variant="outline" size="xs" onClick={handleReset}>
          Reset
        </Button>
        <Button size="xs" onClick={() => onApply(draft)}>
          Apply
        </Button>
      </CdlDialogFooter>
    </>
  )
}

/**
 * Tri-state square for the Select all row, mirroring CdlCombobox's
 * CheckSquare. The `Checkbox` primitive has no indeterminate state, so the
 * mixed ("some columns visible") case needs a hand-rolled box.
 */
function TriStateCheckSquare({ state }: { state: "on" | "off" | "mixed" }) {
  return (
    <span
      aria-hidden
      className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        state === "off"
          ? "border-input"
          : "border-primary bg-primary text-primary-foreground"
      }`}
    >
      {state === "on" && <Check weight="bold" className="size-3" />}
      {state === "mixed" && <Minus weight="bold" className="size-3" />}
    </span>
  )
}

// --- Sortable Dropdown Row ---

function SortableDropdownRow({
  column,
  onToggle,
  reorderable,
}: {
  column: CdlColumnConfig
  onToggle: (id: string) => void
  reorderable: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: transform ? CSS.Transform.toString({ ...transform, x: 0 }) : undefined,
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 ${isDragging ? "z-10 bg-muted/50" : ""}`}
    >
      {reorderable && (
        <button
          {...attributes}
          {...listeners}
          className="touch-none text-muted-foreground hover:text-foreground transition-colors cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="size-3" />
        </button>
      )}
      <Checkbox
        checked={column.visible}
        onCheckedChange={() => onToggle(column.id)}
      />
      <span
        className={`text-sm ${column.visible ? "text-foreground" : "text-muted-foreground"}`}
      >
        {column.label}
      </span>
    </div>
  )
}

// --- Dropdown Component ---

function CdlTableConfiguratorDropdown({
  columns,
  onChange,
  defaultOpen = false,
  reorderable = true,
}: Omit<CdlTableConfiguratorProps, "variant">) {
  const [open, setOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState<CdlColumnConfig[]>(columns)
  const [search, setSearch] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Sync draft when columns change externally or popover opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(columns)
      setSearch("")
    }
    setOpen(next)
  }

  const query = search.toLowerCase()
  const filteredColumns = draft.filter((c) =>
    c.label.toLowerCase().includes(query)
  )
  // All columns (unfiltered) for drag context — only filtered ones render
  const allIds = draft.map((c) => c.id)

  const visibleCount = draft.filter((c) => c.visible).length
  const totalCount = draft.length

  // Both handlers compute from `draft` and notify the parent outside the state
  // updater. Calling onChange *inside* a setDraft updater sets parent state
  // during this component's render phase, which React reports as "Cannot update
  // a component while rendering a different component". Each handler runs from
  // its own user event, so reading `draft` directly is safe — the same pattern
  // handleReset already uses.
  function handleToggle(id: string) {
    const updated = draft.map((c) =>
      c.id === id ? { ...c, visible: !c.visible } : c
    )
    setDraft(updated)
    onChange(updated)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = draft.findIndex((c) => c.id === active.id)
      const newIndex = draft.findIndex((c) => c.id === over.id)
      const reordered = arrayMove(draft, oldIndex, newIndex)
      setDraft(reordered)
      onChange(reordered)
    }
  }

  function handleReset() {
    setDraft(columns)
    onChange(columns)
  }

  const allChecked =
    filteredColumns.length > 0 && filteredColumns.every((c) => c.visible)
  const someChecked = filteredColumns.some((c) => c.visible)

  // Acts on the filtered set, so "Select all" during a search only
  // affects the columns the user can see.
  function handleToggleAll() {
    const target = !allChecked
    const filteredIds = new Set(filteredColumns.map((c) => c.id))
    const updated = draft.map((c) =>
      filteredIds.has(c.id) ? { ...c, visible: target } : c
    )
    setDraft(updated)
    onChange(updated)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs">
          <Columns3 className="size-3" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-0">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b">
          <Search className="size-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-auto border-0 rounded-none p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-sm"
          />
        </div>

        {/* Select all — tri-state, same pattern as CdlCombobox */}
        {filteredColumns.length > 0 && (
          <button
            onClick={handleToggleAll}
            className="flex w-full items-center gap-2 px-2 py-1.5 border-b hover:bg-muted/50 transition-colors"
          >
            {reorderable && <span aria-hidden className="size-3 shrink-0" />}
            <TriStateCheckSquare
              state={allChecked ? "on" : someChecked ? "mixed" : "off"}
            />
            <span className="text-sm text-foreground">
              {search
                ? `Select all ${filteredColumns.length} matches`
                : "Select all"}
            </span>
          </button>
        )}

        {/* Column list */}
        <div className="py-1 max-h-[280px] overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
              {filteredColumns.map((column) => (
                <SortableDropdownRow
                  key={column.id}
                  column={column}
                  onToggle={handleToggle}
                  reorderable={reorderable}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {visibleCount} of {totalCount} visible
          </span>
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// --- Full Dialog Component ---

function CdlTableConfiguratorDialog({
  columns,
  onChange,
  defaultOpen = false,
  reorderable = true,
}: Omit<CdlTableConfiguratorProps, "variant">) {
  const [open, setOpen] = useState(defaultOpen)
  const [key, setKey] = useState(0)

  function handleOpenChange(next: boolean) {
    if (next) setKey((k) => k + 1)
    setOpen(next)
  }

  function handleApply(updated: CdlColumnConfig[]) {
    onChange(updated)
    setOpen(false)
  }

  return (
    <CdlDialog open={open} onOpenChange={handleOpenChange}>
      <CdlDialogTrigger asChild>
        <Button variant="outline" size="xs">
          <Columns3 className="size-3" />
          Columns
        </Button>
      </CdlDialogTrigger>
      <CdlDialogContent className="sm:max-w-[480px]">
        <CdlDialogHeader title="Configure Columns" />
        <CdlTableConfiguratorPanel
          key={key}
          columns={columns}
          onApply={handleApply}
          reorderable={reorderable}
        />
      </CdlDialogContent>
    </CdlDialog>
  )
}

// --- Public Component (switches on variant) ---

export function CdlTableConfigurator({
  variant = "dropdown",
  ...props
}: CdlTableConfiguratorProps) {
  if (variant === "dialog") {
    return <CdlTableConfiguratorDialog {...props} />
  }
  return <CdlTableConfiguratorDropdown {...props} />
}

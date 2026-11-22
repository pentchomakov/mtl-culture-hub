import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, FunnelSimple as ListFilter, Plus, CaretDown as ChevronDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Types ---

export type CdlFilterOperator = "is" | "is not" | "is any of" | "is above" | "is below" | "is between"
export type CdlLogicOperator = "and" | "or"

export interface CdlFilterCondition {
  id: string
  field: string
  operator: CdlFilterOperator
  values: string[]
  logicOperator: CdlLogicOperator
}

export interface FieldConfig {
  key: string
  label: string
  operators: readonly CdlFilterOperator[]
  options: string[]
  unit?: string
  unitPosition?: "prefix" | "suffix"
}

interface DataTableFilterProps {
  /** Field definitions — each field has a key, label, allowed operators, and selectable options. */
  fields: FieldConfig[]
  /** The current list of active filter conditions. */
  filters: CdlFilterCondition[]
  /** Called whenever filters are added, updated, or removed. */
  onChange: (filters: CdlFilterCondition[]) => void
  /** Open the filter panel on initial render. Useful for Storybook and testing. */
  defaultOpen?: boolean
}

// --- Helpers ---

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `filter-${crypto.randomUUID()}`
  }
  return `filter-${Math.random().toString(36).slice(2)}-${Date.now()}`
}


// --- Sub-components ---

function FilterFieldSelector({
  fields,
  value,
  onChange,
}: {
  fields: FieldConfig[]
  value: string
  onChange: (field: string) => void
}) {
  const label = fields.find((f) => f.key === value)?.label ?? "Select field"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
          {label}
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {fields.map((field) => (
          <DropdownMenuItem key={field.key} onSelect={() => onChange(field.key)}>
            {field.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CdlFilterOperatorSelector({
  operators,
  value,
  onChange,
}: {
  operators: readonly CdlFilterOperator[]
  value: CdlFilterOperator
  onChange: (op: CdlFilterOperator) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1.5 text-xs hover:bg-muted transition-colors">
          {value}
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {operators.map((op) => (
          <DropdownMenuItem key={op} onSelect={() => onChange(op)}>
            {op}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FilterValueSelector({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(selected)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOptions = options.filter((o) =>
    o.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const allFilteredSelected = filteredOptions.length > 0 && filteredOptions.every((o) => draft.includes(o))

  function toggleDraftValue(value: string) {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setDraft((prev) => prev.filter((v) => !filteredOptions.includes(v)))
    } else {
      setDraft((prev) => [...new Set([...prev, ...filteredOptions])])
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(selected)
      setSearchQuery("")
    }
    setOpen(nextOpen)
  }

  function applyDraft() {
    onChange(draft)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {selected.length > 0 ? (
        <div className="inline-flex items-stretch rounded-md bg-secondary border border-border overflow-hidden">
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 pl-2.5 pr-1.5 py-1.5 text-xs hover:bg-muted transition-colors">
              <span className="font-normal">
                {selected.slice(0, 2).join(", ")}
              </span>
              {selected.length > 2 && (
                <span className="inline-flex items-center justify-center rounded bg-muted px-1 py-0.5 text-[10px] font-normal leading-none">
                  +{selected.length - 2}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <button
            type="button"
            aria-label="Clear selection"
            className="flex items-center justify-center w-6 border-l border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            onClick={() => onChange([])}
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 rounded-md border border-dashed px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <Plus className="size-3" />
            Select value
          </button>
        </PopoverTrigger>
      )}
        <PopoverContent align="start" className="w-48 p-0">
          {/* Search */}
          <div className="border-b px-3 py-2">
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-auto border-0 rounded-none p-0 text-xs shadow-none focus-visible:ring-0 placeholder:text-xs"
            />
          </div>

          {/* Options */}
          <div className="max-h-[150px] overflow-y-auto p-3 flex flex-col gap-3">
            {/* Select All */}
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={toggleSelectAll}
              />
              Select All
            </label>
            <Separator />
            {/* Individual options */}
            {filteredOptions.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <Checkbox
                  checked={draft.includes(option)}
                  onCheckedChange={() => toggleDraftValue(option)}
                />
                {option}
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t p-1 flex justify-end">
            <Button variant="ghost" size="xs" onClick={applyDraft}>
              Apply
            </Button>
          </div>
        </PopoverContent>
    </Popover>
  )
}

const NUMERIC_OPERATORS: CdlFilterOperator[] = ["is above", "is below", "is between"]

function UnitInput({
  value,
  onChange,
  placeholder,
  unit,
  unitPosition = "suffix",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  unit?: string
  unitPosition?: "prefix" | "suffix"
}) {
  const hasPrefix = unit && unitPosition === "prefix"
  const hasSuffix = unit && unitPosition === "suffix"
  return (
    <div className="relative flex items-center">
      {hasPrefix && (
        <span className="pointer-events-none absolute left-2.5 text-xs text-muted-foreground">{unit}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-auto rounded-md border bg-muted/50 py-1.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-ring",
          hasPrefix ? "pl-5 pr-2.5" : hasSuffix ? "pl-2.5 pr-5" : "px-2.5"
        )}
      />
      {hasSuffix && (
        <span className="pointer-events-none absolute right-2.5 text-xs text-muted-foreground">{unit}</span>
      )}
    </div>
  )
}

function FilterNumericInput({
  operator,
  values,
  onChange,
  unit,
  unitPosition,
}: {
  operator: CdlFilterOperator
  values: string[]
  onChange: (values: string[]) => void
  unit?: string
  unitPosition?: "prefix" | "suffix"
}) {
  if (operator === "is between") {
    return (
      <div className="flex items-center gap-1.5">
        <UnitInput
          value={values[0] ?? ""}
          onChange={(v) => onChange([v, values[1] ?? ""])}
          placeholder="Min"
          unit={unit}
          unitPosition={unitPosition}
        />
        <span className="text-xs text-muted-foreground">and</span>
        <UnitInput
          value={values[1] ?? ""}
          onChange={(v) => onChange([values[0] ?? "", v])}
          placeholder="Max"
          unit={unit}
          unitPosition={unitPosition}
        />
      </div>
    )
  }

  return (
    <UnitInput
      value={values[0] ?? ""}
      onChange={(v) => onChange([v])}
      placeholder="Value"
      unit={unit}
      unitPosition={unitPosition}
    />
  )
}

// --- Filter Row ---

function FilterRow({
  condition,
  fields,
  isFirst,
  onUpdate,
  onRemove,
}: {
  condition: CdlFilterCondition
  fields: FieldConfig[]
  isFirst: boolean
  onUpdate: (condition: CdlFilterCondition) => void
  onRemove: () => void
}) {
  const fieldConfig = fields.find((f) => f.key === condition.field)
  const operators = fieldConfig?.operators ?? ["is"]
  const options = fieldConfig?.options ?? []
  const isNumeric = NUMERIC_OPERATORS.includes(condition.operator)
  const unit = fieldConfig?.unit
  const unitPosition = fieldConfig?.unitPosition

  return (
    <div className="flex items-center gap-1.5 p-2 border-b last:border-b-0">
      <span className="w-10 shrink-0 text-xs flex justify-end">
        {isFirst ? <span className="font-normal text-foreground">Where</span> : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-0.5 text-xs font-normal text-foreground hover:text-foreground/80 transition-colors">
                {condition.logicOperator === "or" ? "Or" : "And"}
                <ChevronDown className="size-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[80px]">
              <DropdownMenuItem onSelect={() => onUpdate({ ...condition, logicOperator: "and" })}>
                And
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onUpdate({ ...condition, logicOperator: "or" })}>
                Or
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </span>

      <FilterFieldSelector
        fields={fields}
        value={condition.field}
        onChange={(field) => {
          const newFieldConfig = fields.find((f) => f.key === field)
          onUpdate({
            ...condition,
            field,
            operator: newFieldConfig?.operators[0] ?? "is",
            values: [],
          })
        }}
      />

      <CdlFilterOperatorSelector
        operators={operators}
        value={condition.operator}
        onChange={(operator) => onUpdate({ ...condition, operator, values: [] })}
      />

      {isNumeric ? (
        <FilterNumericInput
          operator={condition.operator}
          values={condition.values}
          onChange={(values) => onUpdate({ ...condition, values })}
          unit={unit}
          unitPosition={unitPosition}
        />
      ) : (
        <FilterValueSelector
          options={options}
          selected={condition.values}
          onChange={(values) => onUpdate({ ...condition, values })}
        />
      )}

      <div className="ml-auto shrink-0 flex items-center">
        <button
          type="button"
          aria-label="Remove filter"
          onClick={onRemove}
          className="size-6 rounded hover:bg-muted transition-colors text-muted-foreground/50 hover:text-muted-foreground flex items-center justify-center cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// --- Main Component ---

export function CdlDataTableFilter({ fields, filters, onChange, defaultOpen = false }: DataTableFilterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isClearing, setIsClearing] = useState(false)
  const [hasExiting, setHasExiting] = useState(false)

  const activeCount = filters.filter((f) =>
    f.operator === "is between"
      ? f.values[0]?.trim() !== "" && f.values[1]?.trim() !== ""
      : f.values.length > 0 && f.values[0]?.trim() !== ""
  ).length

  function addFilter() {
    const firstField = fields[0]
    if (!firstField) return
    onChange([
      ...filters,
      {
        id: generateId(),
        field: firstField.key,
        operator: firstField.operators[0] ?? "is",
        values: [],
        logicOperator: "and",
      },
    ])
  }

  function updateFilter(id: string, updated: CdlFilterCondition) {
    onChange(filters.map((f) => (f.id === id ? updated : f)))
  }

  function removeFilter(id: string) {
    setHasExiting(true)
    onChange(filters.filter((f) => f.id !== id))
  }

  function clearAll() {
    setHasExiting(true)
    setIsClearing(true)
    onChange([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs">
          <ListFilter className="size-3" />
          Filter
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center rounded bg-muted border border-border size-3.5 text-[10px] font-normal leading-none">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-max min-w-[480px] p-0 rounded-lg">
        {/* Filter rows */}
        <div style={{ minHeight: 46 }}>
          <AnimatePresence onExitComplete={() => { setIsClearing(false); setHasExiting(false) }}>
            {filters.map((condition, index) => (
              <motion.div
                key={condition.id}
                initial={index === 0 ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={index === 0 ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut", delay: isClearing ? index * 0.05 : 0 }}
                style={{ overflow: "hidden" }}
              >
                <FilterRow
                  condition={condition}
                  fields={fields}
                  isFirst={index === 0}
                  onUpdate={(updated) => updateFilter(condition.id, updated)}
                  onRemove={() => removeFilter(condition.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {filters.length === 0 && !hasExiting && (
            <div className="h-[46px] flex items-center justify-center px-3 text-xs text-muted-foreground">
              No filters applied
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-1">
          <Button variant="ghost" size="xs" onClick={addFilter}>
            <Plus className="size-3" />
            Add Filter
          </Button>
          {filters.length > 0 && (
            <Button variant="ghost" size="xs" onClick={clearAll} className="text-destructive hover:text-destructive">
              Clear All
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

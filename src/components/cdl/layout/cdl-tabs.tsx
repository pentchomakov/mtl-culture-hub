import React, { useId, useState } from "react"
import { motion } from "motion/react"
import { Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Marker state for a step in the `process` variant. Omit for a plain, not-yet-reached step. */
export type CdlTabStatus = "complete" | "attention" | "locked"

/** Which kind of bar to render. `process` numbers the tabs in order; `gated` holds a final tab shut. */
export type CdlTabsVariant = "default" | "process" | "gated"

export interface CdlTabItem {
  /** Text shown in the tab and used as the tab's value/key. Must be unique within the set. */
  label: string
  /** Optional leading icon (e.g. a lucide-react element) rendered before the label. */
  icon?: React.ReactNode
  /** Optional trailing badge text (e.g. a count) rendered after the label. */
  badge?: string
  /** Panel content rendered automatically when this tab is active (self-contained mode). Omit on every item to render shared `children` instead. */
  content?: React.ReactNode
  /** `process` variant only. "complete" swaps the number for a check, "attention" marks a failed check, "locked" blocks the step until an earlier one is done. Omit for a plain step. */
  status?: CdlTabStatus
  /** `gated` variant only. True once the work inside this tab is finished — the dashed marker closes into a check and the tab stops holding the gate shut. */
  done?: boolean
  /** `gated` variant only. Marks the final tab, which stays locked until every other tab reports `done`. Set it on one item at most, and put that item last. If another tab reopens while the user sits on this one, move `activeTab` off it — a locked tab cannot stay active. */
  gate?: boolean
  /** `gated` variant only. Holds this tab shut wherever it sits in the order — for a step that cannot open until an earlier one is signed off. The marker becomes a lock and the tab cannot become active, so move `activeTab` off it when it locks. A locked tab is never `done`, so it also keeps the `gate` tab shut. */
  locked?: boolean
  /** `gated` variant only. What opens a `locked` tab, shown on hover. Defaults to naming the nearest tab before it that is not `done`. */
  lockedReason?: string
}

export interface CdlTabsProps {
  /** The tabs to render, in display order. */
  items: CdlTabItem[]
  /** Which bar to render. "default" is the plain strip; "process" numbers the steps and joins them with connectors; "gated" marks unfinished tabs with a dashed ring and locks the final tab. Defaults to "default". */
  variant?: CdlTabsVariant
  /** Initial active tab label for uncontrolled mode. Defaults to the first tab. */
  defaultTab?: string
  /** Active tab label for controlled mode. When provided, the parent owns active state and must update it in `onTabChange`. */
  activeTab?: string
  /** Called with the new tab label when the user selects a tab. */
  onTabChange?: (label: string) => void
  /** Shared content shown under the bar when no item defines its own `content` (e.g. the parent swaps content in response to `onTabChange`). */
  children?: React.ReactNode
  /** Node pinned above the tab bar inside the same non-scrolling header block (e.g. a page header). */
  header?: React.ReactNode
  /** Fill the parent's height: pins the bar and makes the content area scroll. Requires a height-bounded **flex column** parent (e.g. `flex flex-col h-[480px]`) — in a plain block the tabs grow past it instead of scrolling inside it. Defaults to false (tabs grow with their content). */
  fill?: boolean
  /** When `fill`, controls content overflow. Use "hidden" for full-height children that scroll themselves (e.g. chat panels). Defaults to "auto". */
  overflow?: "auto" | "hidden"
  /** Element type for the scrollable content region. Defaults to "div". */
  contentAs?: React.ElementType
  /** Ref to the content region element (e.g. for measuring or animating its width). */
  contentRef?: React.Ref<HTMLElement>
  /** Extra classes for the Tabs root. */
  className?: string
  /** Extra classes for the tab bar (TabsList). */
  barClassName?: string
  /** Extra classes for the content region. */
  contentClassName?: string
}

/** Shared marker geometry. The marker carries the step's state so the label keeps one weight per state. */
const MARKER_BASE =
  "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums"

type MarkerKind =
  | "complete"
  | "attention"
  | "locked"
  | "current"
  | "upcoming"
  | "pending"
  | "open"

function markerKind(
  item: CdlTabItem,
  variant: CdlTabsVariant,
  isActive: boolean,
  gateOpen: boolean
): MarkerKind {
  if (variant === "gated") {
    // A locked tab reads as locked wherever it sits, so the bar can hold a
    // middle step shut and not only its last one.
    if (item.locked) return "locked"
    if (item.gate) return gateOpen ? "open" : "locked"
    return item.done ? "complete" : "pending"
  }
  if (item.status === "complete") return "complete"
  if (item.status === "attention") return "attention"
  if (item.status === "locked") return "locked"
  return isActive ? "current" : "upcoming"
}

function TabMarker({ kind, step }: { kind: MarkerKind; step: number }) {
  switch (kind) {
    case "complete":
      return (
        <span className={cn(MARKER_BASE, "bg-muted text-muted-foreground")}>
          <Check className="size-3 stroke-[3]" />
        </span>
      )
    case "attention":
      return (
        <span
          className={cn(MARKER_BASE, "border border-destructive text-destructive")}
        >
          !
        </span>
      )
    case "locked":
      return (
        <span className={cn(MARKER_BASE, "border text-muted-foreground")}>
          <Lock className="size-2.5" />
        </span>
      )
    case "current":
      return (
        <span className={cn(MARKER_BASE, "border border-foreground text-foreground")}>
          {step}
        </span>
      )
    case "upcoming":
      return (
        <span className={cn(MARKER_BASE, "border text-muted-foreground")}>{step}</span>
      )
    // The dashed ring says the work inside the tab is not complete. Order carries no
    // meaning in the gated variant, so it holds no number.
    case "pending":
      return (
        <span
          className={cn(MARKER_BASE, "size-4.5 border border-dashed border-ring")}
        />
      )
    case "open":
      return <span className={cn(MARKER_BASE, "border border-foreground")} />
  }
}

export function CdlTabs({
  items,
  variant = "default",
  defaultTab,
  activeTab,
  onTabChange,
  children,
  header,
  fill = false,
  overflow = "auto",
  contentAs,
  contentRef,
  className,
  barClassName,
  contentClassName,
}: CdlTabsProps) {
  const isControlled = activeTab !== undefined
  const [internalTab, setInternalTab] = useState(defaultTab ?? items[0]?.label)
  const currentTab = isControlled ? activeTab : internalTab
  // Namespace the shared layout animation per instance so multiple CdlTabs on
  // one page don't fight over the same sliding indicator.
  const indicatorId = useId()

  const handleTabChange = (label: string) => {
    if (!isControlled) setInternalTab(label)
    onTabChange?.(label)
  }

  const hasTabContent = items.some((item) => item.content != null)
  const ContentTag = contentAs ?? "div"

  const isStepped = variant === "process" || variant === "gated"
  // Every other tab must report `done` before the gated tab opens.
  const gateOpen =
    variant !== "gated" || items.every((item) => item.gate || item.done)

  const triggerClass = cn(
    "relative h-full flex-none gap-2 px-2 font-medium",
    isStepped
      ? "text-muted-foreground data-[state=active]:!text-foreground data-[state=active]:!border-b-transparent"
      : "transition-opacity duration-200 opacity-50 data-[state=active]:opacity-100 data-[state=active]:!border-b-transparent"
  )

  const renderBody = (item: CdlTabItem, index: number) => {
    const isActive = item.label === currentTab
    return (
      <>
        {isStepped && (
          <TabMarker
            kind={markerKind(item, variant, isActive, gateOpen)}
            step={index + 1}
          />
        )}
        {item.icon}
        {item.label}
        {item.badge && (
          <Badge
            variant="secondary"
            className="-ml-1 rounded-sm px-1.5 py-0 text-[11px] font-medium tabular-nums"
          >
            {item.badge}
          </Badge>
        )}
        {isActive && (
          <motion.span
            layoutId={`${indicatorId}-tab-indicator`}
            className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary"
            transition={{ type: "spring", stiffness: 500, damping: 45, mass: 0.5 }}
          />
        )}
      </>
    )
  }

  // A blocked tab is not a Radix trigger: it can never become active, and it still has to
  // answer a click by explaining what is holding it shut.
  const renderBlocked = (item: CdlTabItem, index: number) => (
    <button
      type="button"
      className={cn(
        "relative inline-flex h-full flex-none items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0"
      )}
      aria-disabled
    >
      {renderBody(item, index)}
    </button>
  )

  const renderTab = (item: CdlTabItem, index: number) => {
    if (variant === "gated" && item.locked) {
      // The lock says what opens it. Without a stated reason, name the nearest
      // tab before this one that still has work.
      const prerequisite = items
        .slice(0, index)
        .reverse()
        .find((earlier) => !earlier.done)
      return (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>{renderBlocked(item, index)}</TooltipTrigger>
            <TooltipContent>
              {item.lockedReason ??
                (prerequisite ? `Finish ${prerequisite.label} first` : "Finish the earlier steps first")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (variant === "gated" && item.gate && !gateOpen) {
      // Name what is still open, so the lock says what to do rather than just refusing.
      const openCount = items.filter((other) => !other.gate && !other.done).length
      return (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>{renderBlocked(item, index)}</TooltipTrigger>
            <TooltipContent>
              {openCount === 1
                ? `Finish ${items.find((other) => !other.gate && !other.done)?.label} first`
                : `Finish the ${openCount} open sections first`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (variant === "process" && item.status === "locked") {
      // Name the nearest step that is still open, so the tooltip says what to do next.
      const prerequisite = items
        .slice(0, index)
        .reverse()
        .find((earlier) => earlier.status !== "complete")
      return (
        <TooltipProvider key={item.label}>
          <Tooltip>
            <TooltipTrigger asChild>{renderBlocked(item, index)}</TooltipTrigger>
            <TooltipContent>
              {prerequisite
                ? `Finish ${prerequisite.label} first`
                : "Finish the earlier steps first"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <TabsTrigger
        key={item.label}
        value={item.label}
        className={cn(triggerClass, "cursor-pointer")}
      >
        {renderBody(item, index)}
      </TabsTrigger>
    )
  }

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      className={cn("flex flex-col gap-0", fill && "flex-1 min-h-0", className)}
    >
      <div className="shrink-0">
        {header}
        <TabsList
          variant="line"
          className={cn(
            "w-full justify-start gap-0 rounded-none border-b bg-transparent p-0 px-3 overflow-x-auto overflow-y-hidden overscroll-x-none",
            // A bar wider than its container still scrolls, but with no
            // scrollbar: the bar is one row tall, so a track drawn under it
            // eats the row and leaves the labels clipped.
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            // The 20px marker needs the extra room to sit clear of both bar edges.
            isStepped ? "!h-12" : "!h-10",
            // The gated variant has no connectors, so plain space is what separates
            // one step from the next. The process variant already has its rules.
            variant === "gated" && "gap-2",
            barClassName
          )}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.label}>
              {/* The gated variant sets its final tab apart with one vertical rule
                  instead of connectors, because the tabs before it have no order. */}
              {variant === "gated" && item.gate && (
                <span className="mx-3 h-5 w-px shrink-0 self-center bg-border" />
              )}
              {renderTab(item, index)}
              {/* The process variant joins its steps, which is what states the order. */}
              {variant === "process" && index < items.length - 1 && (
                <span className="mx-1 h-px w-6 shrink-0 self-center bg-border" />
              )}
            </React.Fragment>
          ))}
        </TabsList>
      </div>

      <ContentTag
        ref={contentRef as React.Ref<HTMLElement>}
        className={cn(
          "flex flex-col gap-4",
          // `fill` already pads the scroll region. Without it the content would sit flush
          // against the bar's bottom border, so give it the same top gap.
          fill
            ? cn("flex-1 overflow-x-hidden overscroll-none p-3", overflow === "hidden" ? "overflow-hidden" : "overflow-y-auto")
            : "pt-4",
          contentClassName
        )}
      >
        {hasTabContent
          ? items.map((item) => (
              <TabsContent
                key={item.label}
                value={item.label}
                className="mt-0 flex flex-1 flex-col gap-4 outline-none"
              >
                {item.content}
              </TabsContent>
            ))
          : children}
      </ContentTag>
    </Tabs>
  )
}

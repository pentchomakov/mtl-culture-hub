import React from "react"
import { Info } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type BlockVariant = "default" | "flush" | "plain"

const BlockGroupContext = React.createContext<BlockVariant>("default")

interface BlockGroupProps {
  children: React.ReactNode
  className?: string
  /**
   * Visual style of the block. "default" draws a rounded border around the whole
   * group; "flush" drops the outer border but keeps one around the content area;
   * "plain" draws no borders at all — the content sits directly on the page
   * surface (pair with CdlDataTable's "plain" variant for a borderless list).
   */
  variant?: BlockVariant
}

export function CdlBlockGroup({ children, className, variant = "default" }: BlockGroupProps) {
  return (
    <BlockGroupContext.Provider value={variant}>
      <div
        className={cn(
          "flex flex-col",
          variant === "default" && "relative rounded-md bg-background overflow-hidden",
          className,
        )}
      >
        {children}
        {variant === "default" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md border border-border z-[2]" />
        )}
      </div>
    </BlockGroupContext.Provider>
  )
}

export interface CdlBlockHeaderCrumb {
  /** Text for this path segment. */
  label: string
  /** Navigate to this segment. Omit to render the segment as static text (e.g. the current location). */
  onClick?: () => void
}

interface BlockHeaderProps {
  /** Header title. Ignored when `breadcrumbs` is provided. */
  title?: string
  /**
   * Breadcrumb trail rendered in place of the title, for headers that double as
   * path navigation (e.g. a file browser). Segments with an `onClick` render as
   * muted, clickable links; the last segment is styled like the title since it
   * is the current location. A single-segment trail looks identical to `title`.
   */
  breadcrumbs?: CdlBlockHeaderCrumb[]
  /**
   * Leading slot rendered before the title/breadcrumbs, e.g. a back button in a
   * file browser. Kept inline with the path so it aligns with the trail.
   */
  leading?: React.ReactNode
  /**
   * Short contextual help revealed on hover via an info icon after the title
   * (e.g. what a chart's series mean, or a table's filter criteria). Ignored
   * when `breadcrumbs` is provided.
   */
  info?: React.ReactNode
  /**
   * A line of supporting copy under the title — what the block shows, in plain
   * language (e.g. how to read a chart). Always visible, unlike `info`; pair the
   * two when there's both a summary and detail worth keeping out of the content
   * area. The header grows to fit it. Ignored when `breadcrumbs` is provided.
   */
  description?: React.ReactNode
  /** Right-aligned action slot. */
  actions?: React.ReactNode
}

export function CdlBlockHeader({ title, breadcrumbs, leading, info, description, actions }: BlockHeaderProps) {
  const variant = React.useContext(BlockGroupContext)
  // A description makes the header two lines, so the fixed single-row height gives
  // way to a minimum plus padding, and actions align to the title rather than to
  // the block's vertical centre.
  const hasDescription = !!description && !breadcrumbs?.length
  return (
    <div
      className={cn(
        "flex gap-2.5",
        hasDescription ? "items-start" : "items-center",
        variant === "default" && "shrink-0 border-b pl-3 pr-2",
        variant === "default" && (hasDescription ? "min-h-[49px] py-2.5" : "h-[49px]"),
        (variant === "flush" || variant === "plain") && "pb-2 pt-0",
      )}
    >
      {leading}
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="flex-1 min-w-0 flex items-center gap-1.5">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1
            return (
              <React.Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <span aria-hidden="true" className="text-base leading-normal text-muted-foreground/60 select-none">
                    ›
                  </span>
                )}
                {crumb.onClick && !isLast ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="text-base leading-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer truncate"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "text-base leading-normal truncate",
                      isLast ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            )
          })}
        </nav>
      ) : (
        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-base font-medium leading-normal">{title}</p>
            {info && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="More information"
                      className="flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Info size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <span className="block text-left font-normal leading-relaxed">{info}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {hasDescription && (
            <p className="text-sm leading-normal text-muted-foreground text-pretty">{description}</p>
          )}
        </div>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface BlockContentProps {
  children: React.ReactNode
  className?: string
  /**
   * Inset the content from the block's edges, aligning its left edge with the
   * header title. Use it for anything that is not a table: a definition list, a
   * form, a paragraph, a grid of cards.
   *
   * It is opt-in rather than the default because the common case is a
   * CdlDataTable, which carries its own cell padding and has to meet the
   * block's border — padding it would leave a gap the table's own row dividers
   * stop short of. Everything else needs this, so reach for it instead of
   * hand-rolling a padding class: the value is the header's, so the two line up.
   */
  inset?: boolean
}

/** Matches the header's `pl-3`, so inset content aligns with the block title. */
const INSET = "p-3"

export function CdlBlockContent({ children, className, inset }: BlockContentProps) {
  const variant = React.useContext(BlockGroupContext)
  if (variant === "flush" || variant === "plain") {
    // Outer div: clips content (overflow-hidden) and holds the border overlay.
    // Inner div: takes className so scroll/padding classes don't conflict with overflow-hidden.
    // "flush" rounds the corners (its border reads better rounded); "plain" keeps
    // the same two-layer scroll structure but squares the corners and paints no border.
    return (
      <div className={cn("flex-1 min-h-0 relative overflow-hidden", variant === "flush" && "rounded-md")}>
        <div className={cn("h-full", inset && INSET, className)}>
          {children}
        </div>
        {variant === "flush" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-md border border-border z-[2]" />
        )}
      </div>
    )
  }
  // A table's last row ends in its own 1px bottom border. The block's border (or its
  // footer's top border) would stack with it into a 2px line, so pull this wrapper up
  // 1px and let that border sit under the block's own. The pull is on the wrapper,
  // not on the table: a margin inside the table's own scroll root would make that
  // root 1px vertically scrollable.
  return (
    <div className={cn("flex-1 has-[[data-slot=table-container]]:-mb-px", inset && INSET, className)}>
      {children}
    </div>
  )
}

interface BlockFooterProps {
  children: React.ReactNode
  /** Class names merged after the defaults. Use to override the footer's layout per-instance, e.g. `"justify-start"` to left-align a caption (content is right-aligned by default). */
  className?: string
}

export function CdlBlockFooter({ children, className }: BlockFooterProps) {
  const variant = React.useContext(BlockGroupContext)
  return (
    <div
      className={cn(
        "flex items-center justify-end py-2",
        variant === "default" && "border-t pl-3 pr-2",
        className,
      )}
    >
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

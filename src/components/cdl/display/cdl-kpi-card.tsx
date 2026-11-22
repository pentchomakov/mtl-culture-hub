import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CdlSkeleton } from "./cdl-skeleton"

interface CdlKpiCardProps {
  /**
   * Vertical density. `"default"` reserves a fixed 110px height and pushes the
   * header and the value to opposite ends, so a row of cards keeps one rhythm
   * however much each card holds. `"compact"` drops the reserved height and
   * stacks the header directly above the value, which roughly halves the card
   * — use it when the metrics are a summary strip above the real content and
   * the vertical space is better spent below.
   *
   * Compact scales the type down one step with the box (header to `text-xs`,
   * value to `text-lg`), so it stays legible rather than just squashed.
   */
  density?: "compact" | "default"
  /** Small muted label shown at the top of the card. */
  header?: string
  /** Class names for the header text, merged after the default (small muted label). Use to restyle the header per-instance, e.g. a bolder heading: `"text-lg font-semibold text-foreground"`. */
  headerClassName?: string
  /** Primary metric value, rendered large. */
  value?: string
  /** Period-over-period change as a percentage; renders an up/down arrow and color. */
  change?: number
  /** Label describing the comparison period, e.g. "vs last month" */
  changePeriod?: string
  /** Optional icon shown at the top-right. */
  icon?: LucideIcon
  /** Class names for the icon, merged after the default (`text-muted-foreground`). Use to color it for urgency, e.g. a status dot — `"text-amber-500 fill-amber-500"` on a filled `Circle` icon. Leave unset for the default quiet, muted styling. */
  iconClassName?: string
  /** Progress fill from 0–100, shown as a bar beneath the value. */
  progress?: number
  /** Custom body content, rendered beneath the metric block (value/change/progress). Provide it alongside those props to add a breakdown list, custom bar, or multi-line summary, or on its own to fully replace the metric block. */
  children?: React.ReactNode
  /** Drill-down target. With `linkText`, renders a footer link so the card always offers a drill path. */
  href?: string
  /** Text for the footer drill-down link (requires `href`). */
  linkText?: string
  /** Show a skeleton placeholder while async data loads. */
  loading?: boolean
  className?: string
}

export function CdlKpiCard({
  density = "default",
  header,
  headerClassName,
  value,
  change,
  changePeriod = "vs last period",
  icon: Icon,
  iconClassName,
  progress,
  children,
  href,
  linkText,
  loading,
  className,
}: CdlKpiCardProps) {
  const isPositive = change !== undefined && change >= 0
  const hasLink = href !== undefined && linkText !== undefined
  // Compact drops the reserved height and the justify-between spread — those
  // two together are what open the gap between the header and the value.
  const compact = density === "compact"

  return (
    <div
      className={cn(
        "@container flex flex-col rounded-md border bg-background",
        compact ? "justify-start gap-0.5 p-3" : "min-h-[110px] justify-between gap-2 p-4",
        className,
      )}
    >
      {loading ? (
        <>
          <div className="flex items-center justify-between">
            <CdlSkeleton variant="line" className={cn("w-20", compact ? "h-2.5" : "h-3")} />
            <CdlSkeleton variant="rectangle" className={cn("rounded", compact ? "size-3.5" : "size-4")} />
          </div>
          <div className="flex items-end justify-between gap-2">
            <CdlSkeleton variant="rectangle" className={cn("w-28", compact ? "h-5" : "h-6")} />
            <CdlSkeleton variant="line" className="w-16 h-3" />
          </div>
          <CdlSkeleton variant="rectangle" className={cn("w-full rounded-full", compact ? "h-1" : "h-1.5")} />
          {hasLink && <CdlSkeleton variant="line" className="w-24 h-3" />}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            {/* Size class comes FIRST: a Tailwind v4 text-{size} utility also
                sets line-height, so tailwind-merge drops any leading-* passed
                before it. Size first, leading after, or the leading is lost. */}
            <p
              className={cn(
                compact ? "text-xs" : "text-sm",
                "font-normal leading-snug text-muted-foreground truncate",
                headerClassName,
              )}
            >
              {header}
            </p>
            {Icon && (
              <Icon className={cn("shrink-0 text-muted-foreground", compact ? "size-3.5" : "size-4", iconClassName)} />
            )}
          </div>

          {(value !== undefined || change !== undefined || progress !== undefined) && (
            <>
              <div className="flex flex-col gap-y-1 @[200px]:flex-row @[200px]:items-end @[200px]:justify-between @[200px]:gap-x-2">
                <p
                  className={cn(
                    compact ? "text-lg" : "text-xl",
                    "font-medium leading-tight text-accent-foreground",
                  )}
                >
                  {value}
                </p>
                {change !== undefined && (
                  <div className="flex flex-col items-start gap-px @[200px]:items-end">
                    <div
                      className={`flex items-center gap-1 text-xs font-medium ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}
                        {change}%
                      </span>
                    </div>
                    {changePeriod && (
                      <span className="text-xs text-muted-foreground">{changePeriod}</span>
                    )}
                  </div>
                )}
              </div>
              {progress !== undefined && (
                <div
                  className={cn(
                    "w-full overflow-hidden rounded-full bg-muted",
                    compact ? "mt-1 h-1" : "h-1.5",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              )}
            </>
          )}

          {/* Compact has no spare height to give away, so children size to their
              own content instead of stretching to fill the card. */}
          {children !== undefined && <div className={compact ? undefined : "flex-1"}>{children}</div>}

          {hasLink && (
            <Button
              asChild
              variant="linkQuiet"
              size="xs"
              className={cn("group self-start", compact ? "mt-1" : "mt-2")}
            >
              <a href={href}>
                {linkText}
                <ChevronRight className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
          )}
        </>
      )}
    </div>
  )
}

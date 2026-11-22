import React from "react"
import { ArrowLeft, Info } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface CdlBreadcrumbSegment {
  /** Text for this path segment. */
  label: string
  /** Navigate to this segment. Omit to render it as static (non-navigating) text — e.g. a section label that has no page of its own. */
  onClick?: () => void
}

interface PageHeaderProps {
  title: string
  /**
   * Small adornment rendered immediately before the title text — e.g. a partner
   * logo or product avatar. Keep it compact (roughly the cap height of the
   * title); it is decorative, so mark any `img` you pass `aria-hidden`.
   */
  titleIcon?: React.ReactNode
  /**
   * Small status chip rendered immediately after the title text — e.g. a `Badge`
   * reading "Draft", "Archived" or "Beta". Use it for the *state of the thing the
   * page is about*, not for actions or counts; keep it to one or two words so it
   * doesn't compete with the title. It never shrinks, so a long title truncates
   * before the chip does.
   */
  titleBadge?: React.ReactNode
  /**
   * When provided, an info icon is rendered immediately after the title; hovering
   * (or focusing) it reveals this content in a tooltip. Use it for short
   * contextual help about the page — what the screen is for, a data caveat — that
   * would otherwise clutter the body. Keep it to a sentence or two.
   */
  titleInfo?: React.ReactNode
  /**
   * When provided, a leading back button (a left-arrow) is rendered to the left
   * of the breadcrumb/title block and calls this on click. Use it on detail
   * pages to return to the list/parent screen.
   */
  onBack?: () => void
  /** Accessible label for the back button. Defaults to "Go back". */
  backLabel?: string
  /**
   * Breadcrumb trail shown above the title. The page `title` is appended
   * automatically as the current (final) crumb — do not repeat it here.
   * Pass a plain string for a static segment, or `{ label, onClick }` to make
   * it clickable and navigate.
   */
  segments?: Array<string | CdlBreadcrumbSegment>
  actions?: React.ReactNode
}

export function CdlPageHeader({ title, titleIcon, titleBadge, titleInfo, onBack, backLabel = "Go back", segments = [], actions }: PageHeaderProps) {
  const crumbs = segments.map((s) => (typeof s === "string" ? { label: s } : s))
  const showBreadcrumbs = crumbs.length > 0

  return (
    <header className="flex flex-col gap-1.5 border-b p-4">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-2">
          {showBreadcrumbs && (
            <Breadcrumb>
              <BreadcrumbList className="text-sm font-normal">
                {crumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    <BreadcrumbItem>
                      {crumb.onClick ? (
                        <BreadcrumbLink asChild>
                          <button type="button" onClick={crumb.onClick} className="cursor-pointer">
                            {crumb.label}
                          </button>
                        </BreadcrumbLink>
                      ) : (
                        <span className="text-muted-foreground">{crumb.label}</span>
                      )}
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                ))}
                <BreadcrumbItem>
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          <div className="flex min-w-0 items-center gap-2">
            {onBack && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  aria-label={backLabel}
                  className="-ml-1 size-7 shrink-0 text-muted-foreground"
                >
                  <ArrowLeft size={18} />
                </Button>
                <Separator orientation="vertical" className="mr-1 h-5! w-px shrink-0" />
              </>
            )}
            <h1 className="flex min-w-0 items-center gap-2 text-base font-medium leading-tight">
              {titleIcon}
              <span className="truncate">{title}</span>
              {titleBadge && <span className="shrink-0">{titleBadge}</span>}
              {titleInfo && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="More information"
                        className="-ml-1 flex size-5 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Info size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <span className="block text-left font-normal leading-relaxed">{titleInfo}</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h1>
          </div>
        </div>
        {actions && (
          <div className="flex items-end gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}

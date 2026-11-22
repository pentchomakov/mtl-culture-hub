import React from "react"
import { ArrowLeft, IconContext, Info } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export interface CdlPageHeaderTitleMenu {
  /** The value of the current option; its label should match `title`. */
  value: string
  /** The sibling records to switch between, e.g. reporting periods. */
  options: Array<{ value: string; label: string }>
  onValueChange: (value: string) => void
  /** Accessible name of the menu trigger. Defaults to "Switch". */
  label?: string
}

interface PageHeaderProps {
  title: string
  /**
   * Turns the title into a dropdown that switches between sibling records (e.g. "Oct 2026 ⌄" to pick another
   * period). It looks like the plain title plus a chevron: no border, box or fill. `title` stays the accessible
   * h1 (visually hidden) and the final breadcrumb crumb.
   */
  titleMenu?: CdlPageHeaderTitleMenu
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
   * One-line subheader rendered as visible muted text directly under the title.
   * Use it for a short standing description of the page — a scope note or a
   * rule every visitor should read. Unlike `titleInfo` (hidden behind an info
   * tooltip), it is always visible; keep it to a sentence or two.
   */
  description?: React.ReactNode
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

export function CdlPageHeader({ title, titleMenu, titleIcon, titleBadge, titleInfo, description, onBack, backLabel = "Go back", segments = [], actions }: PageHeaderProps) {
  const crumbs = segments.map((s) => (typeof s === "string" ? { label: s } : s))
  const showBreadcrumbs = crumbs.length > 0

  return (
    <header className="flex flex-col gap-1.5 border-b p-4">
      {/* With breadcrumbs the left block is two lines tall and actions stay
          top-aligned beside the trail; with a plain title, center the row so
          the title sits level with taller actions (buttons, selects). */}
      <div className={`flex justify-between gap-6 ${showBreadcrumbs ? "items-start" : "items-center"}`}>
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
              <span className={titleMenu ? "sr-only" : "truncate"}>{title}</span>
              {titleMenu && (
                <Select value={titleMenu.value} onValueChange={titleMenu.onValueChange}>
                  {/* Bold caret so its stroke matches the medium-weight title. */}
                  <IconContext.Provider value={{ weight: "bold" }}>
                    <SelectTrigger
                      aria-label={titleMenu.label ?? "Switch"}
                      className="h-auto gap-1 rounded-sm border-0 bg-transparent p-0 text-base font-medium leading-tight text-foreground shadow-none hover:bg-transparent focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-transparent dark:hover:bg-transparent [&_svg]:opacity-100 [&_svg]:transition-colors hover:[&_svg]:text-foreground data-[state=open]:[&_svg]:text-foreground"
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </IconContext.Provider>
                  <SelectContent>
                    {titleMenu.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
          {description && (
            /* The column's gap-2 (8px) also spaces the breadcrumb row; the
               negative margin tightens only title → description to 4px. */
            <p className="-mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-end gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}

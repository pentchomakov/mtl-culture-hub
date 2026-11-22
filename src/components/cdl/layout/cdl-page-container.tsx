import React, { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { CdlAppSidebar, type CdlAppSidebarProps } from "./cdl-app-sidebar"
import { CdlPageHeader, type CdlBreadcrumbSegment } from "./cdl-page-header"
import { CdlTabs, type CdlTabItem, type CdlTabsVariant } from "./cdl-tabs"
import { usePageTheme } from "@/lib/use-page-theme"
import { usePageColorMode } from "@/lib/use-page-color-mode"
import type { CdlTheme } from "@/themes"

export type { CdlTheme } from "@/themes"
export type { CdlBreadcrumbSegment } from "./cdl-page-header"
export type { CdlTabsVariant } from "./cdl-tabs"

/** A page navigation tab. Alias of {@link CdlTabItem}. */
export type CdlNavLink = CdlTabItem

interface PageContainerProps {
  children?: React.ReactNode
  title?: string
  /** Small adornment (e.g. a partner logo) rendered before the title text. Forwarded to CdlPageHeader. */
  titleIcon?: React.ReactNode
  /** Small status chip (e.g. a "Draft" Badge) rendered after the title text. Forwarded to CdlPageHeader. */
  titleBadge?: React.ReactNode
  /** Short contextual help revealed on hover via an info icon after the title. Forwarded to CdlPageHeader. */
  titleInfo?: React.ReactNode
  /** One-line subheader rendered as visible muted text under the title. Forwarded to CdlPageHeader. */
  description?: React.ReactNode
  /** When set, renders a leading back button in the header that calls this on click. Forwarded to CdlPageHeader. */
  onBack?: () => void
  /** Accessible label for the header back button. Defaults to "Go back". */
  backLabel?: string
  /**
   * Breadcrumb trail above the title. The `title` is appended automatically as
   * the current crumb — do not repeat it. Plain strings render as static text;
   * `{ label, onClick }` segments are clickable and navigate.
   */
  segments?: Array<string | CdlBreadcrumbSegment>
  actions?: React.ReactNode
  navLinks?: CdlNavLink[]
  /**
   * Which tab bar the nav links render as. "default" is the plain strip;
   * "process" numbers the steps and joins them with connectors; "gated" marks
   * unfinished tabs with a dashed ring and locks the final `gate` tab until
   * every other tab reports `done`. In "gated", a link can also carry `locked`
   * (with an optional `lockedReason`) to hold a middle step shut until the
   * steps before it sign off. Defaults to "default". Forwarded to CdlTabs.
   */
  navVariant?: CdlTabsVariant
  /** Initial active tab label for uncontrolled mode. Defaults to the first tab. */
  defaultTab?: string
  /** Active tab label for controlled mode. When provided, the parent owns active state. */
  activeTab?: string
  /** Called when the user clicks a tab. In controlled mode, the parent must update activeTab in response. */
  onTabChange?: (label: string) => void
  /**
   * Controls main content overflow. Use "hidden" for full-height children that handle their own scrolling
   * (e.g. chat panels). Defaults to "auto", which scrolls vertically and reserves the scrollbar's width
   * (`scrollbar-gutter: stable`), so the content does not shift when a scrollbar appears.
   */
  overflow?: "auto" | "hidden"
  /** Extra classes applied to the main content area. */
  contentClassName?: string
  /**
   * A bar pinned flush to the bottom of the content area, below the scroll
   * region and above the page edge. Use it for the action that commits the
   * whole page — signing a period off, submitting a plan — so the button stays
   * in view however far the reader has scrolled. Actions that belong to one
   * table stay on that block's own header instead.
   */
  footer?: React.ReactNode
  /** Props forwarded to CdlAppSidebar (app name, nav groups, user info). */
  sidebar?: CdlAppSidebarProps
  /** Custom content rendered in the sidebar body, replacing navGroups. */
  sidebarContent?: React.ReactNode
  /** Custom content rendered in the sidebar footer, replacing the user row. */
  sidebarFooter?: React.ReactNode
  /** Hides the app sidebar entirely, rendering the page content full-width. */
  hideSidebar?: boolean
  /** Applies a brand theme by setting data-theme on <html> for this page. */
  theme?: CdlTheme
  /** Forces light or dark mode for this page, overriding the user's stored preference. */
  colorMode?: "light" | "dark"
}

const SIDEBAR_TRANSITION_MS = 200

function PageContent({ children, title, titleIcon, titleBadge, titleInfo, description, onBack, backLabel, segments, actions, navLinks, navVariant, defaultTab, activeTab, onTabChange, overflow = "auto", contentClassName, footer }: PageContainerProps) {
  const contentRef = useRef<HTMLElement>(null)
  const { open } = useSidebar()
  const prevOpen = useRef(open)

  // Freeze content width during sidebar transition, then animate to new size
  const freezeRef = useCallback(() => {
    if (prevOpen.current !== open && contentRef.current) {
      const el = contentRef.current
      const frozenWidth = el.offsetWidth

      // Phase 1: freeze at current width (no transition)
      el.style.transition = "none"
      el.style.width = `${frozenWidth}px`
      el.style.minWidth = `${frozenWidth}px`
      el.style.maxWidth = `${frozenWidth}px`

      // Phase 2: after sidebar finishes, animate content to new natural width
      setTimeout(() => {
        // Temporarily remove constraints to measure target width
        el.style.transition = "none"
        el.style.width = ""
        el.style.minWidth = ""
        el.style.maxWidth = ""
        const targetWidth = el.offsetWidth

        // Snap back to frozen width, then transition to target
        el.style.width = `${frozenWidth}px`
        el.style.minWidth = `${frozenWidth}px`
        el.style.maxWidth = `${frozenWidth}px`

        // Force reflow so the browser registers the starting value
        void el.offsetWidth

        el.style.transition = `width 150ms ease-out, min-width 150ms ease-out, max-width 150ms ease-out`
        el.style.width = `${targetWidth}px`
        el.style.minWidth = `${targetWidth}px`
        el.style.maxWidth = `${targetWidth}px`

        // Phase 3: clean up inline styles after animation
        setTimeout(() => {
          el.style.transition = ""
          el.style.width = ""
          el.style.minWidth = ""
          el.style.maxWidth = ""
        }, 150)
      }, SIDEBAR_TRANSITION_MS)
    }
    prevOpen.current = open
  }, [open])

  // Run freeze check on every render where `open` changes
  freezeRef()

  const showTabs = !!navLinks && navLinks.length > 0
  // The footer sits outside the scroll region, so it stays put while the
  // content moves under it, and it spans the full width rather than sitting
  // inside the content padding. Its height is fixed at the height of a `sm`
  // button plus its padding, so the bar does not resize when its contents
  // change — a commit that turns into a status line leaves the page still.
  const pageFooter = footer ? (
    <div className="shrink-0 h-12 border-t bg-background px-3 flex items-center justify-end gap-2">{footer}</div>
  ) : null
  // The scroll region reserves the scrollbar's width whether or not a bar is
  // showing, so content keeps one width as a page grows past the viewport and
  // nothing right-aligned jumps sideways. Only where it scrolls vertically: an
  // "overflow: hidden" page hands scrolling to its children, which set their own.
  // The header and footer stay full width, outside the scroll region.
  const gutter = overflow === "hidden" ? undefined : "[scrollbar-gutter:stable]"
  const pageHeader = title ? <CdlPageHeader title={title} titleIcon={titleIcon} titleBadge={titleBadge} titleInfo={titleInfo} description={description} onBack={onBack} backLabel={backLabel} segments={segments} actions={actions} /> : null

  return (
    <SidebarInset className="md:peer-data-[variant=inset]:rounded-md md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:overflow-hidden min-w-0 w-0 min-h-0!">
      {showTabs ? (
        <CdlTabs
          items={navLinks}
          variant={navVariant}
          defaultTab={defaultTab}
          activeTab={activeTab}
          onTabChange={onTabChange}
          header={pageHeader}
          fill
          overflow={overflow}
          contentAs="main"
          contentRef={contentRef}
          contentClassName={cn(gutter, contentClassName)}
        >
          {children}
        </CdlTabs>
      ) : (
        <>
          <div className="shrink-0">{pageHeader}</div>
          <main ref={contentRef} className={cn("flex-1 overflow-x-hidden overscroll-none flex flex-col gap-4 p-4", overflow === "hidden" ? "overflow-hidden" : "overflow-y-auto", gutter, contentClassName)}>
            {children}
          </main>
        </>
      )}
      {pageFooter}
    </SidebarInset>
  )
}

export function CdlPageContainer({ sidebar, sidebarContent, sidebarFooter, hideSidebar, theme, colorMode, ...props }: PageContainerProps) {
  usePageTheme(theme)
  usePageColorMode(colorMode)
  return (
    // h-dvh is self-anchoring (not dependent on an ancestor providing real height) —
    // the minHeight:0 override below is needed for internal panels to scroll, but it
    // also cancels the base Sidebar's min-h-svh fallback, so this must set height
    // itself rather than relying on a consuming app's own height chain.
    <SidebarProvider className="h-dvh" style={{ minHeight: 0 }}>
      {!hideSidebar && (
        <CdlAppSidebar {...sidebar} footer={sidebarFooter}>{sidebarContent}</CdlAppSidebar>
      )}
      <PageContent {...props} />
    </SidebarProvider>
  )
}

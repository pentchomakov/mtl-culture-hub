import React, { useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { CdlAppSidebar, type CdlAppSidebarProps } from "./cdl-app-sidebar"
import { CdlPageHeader, type CdlBreadcrumbSegment } from "./cdl-page-header"
import { CdlTabs, type CdlTabItem } from "./cdl-tabs"
import { usePageTheme } from "@/lib/use-page-theme"
import { usePageColorMode } from "@/lib/use-page-color-mode"
import type { CdlTheme } from "@/themes"

export type { CdlTheme } from "@/themes"
export type { CdlBreadcrumbSegment } from "./cdl-page-header"

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
  /** Initial active tab label for uncontrolled mode. Defaults to the first tab. */
  defaultTab?: string
  /** Active tab label for controlled mode. When provided, the parent owns active state. */
  activeTab?: string
  /** Called when the user clicks a tab. In controlled mode, the parent must update activeTab in response. */
  onTabChange?: (label: string) => void
  /** Controls main content overflow. Use "hidden" for full-height children that handle their own scrolling (e.g. chat panels). Defaults to "auto". */
  overflow?: "auto" | "hidden"
  /** Extra classes applied to the main content area. */
  contentClassName?: string
  /**
   * Ref to the scrolling content region: the `<main>` below, or the tab content panel when
   * `navLinks` are set. A local addition to the vendored component, like `hideSettings` on the
   * sidebar, and the same prop `CdlTabs` already exposes under the same name.
   *
   * It exists because this container owns the ONLY scroller on the page (`index.css` pins
   * `html`/`body` to the viewport), so a caller with a legitimate reason to move scroll
   * position has no other way to reach the element that holds it. The portal's
   * scroll-to-top on navigation was silently dead for want of exactly this, having been
   * pointed at the nearest reachable element instead, which does not scroll.
   *
   * Merged with this component's own internal ref rather than replacing it, so the width-freeze
   * animation and the caller always observe the same element.
   */
  contentRef?: React.Ref<HTMLElement>
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

function PageContent({ children, title, titleIcon, titleBadge, titleInfo, onBack, backLabel, segments, actions, navLinks, defaultTab, activeTab, onTabChange, overflow = "auto", contentClassName, contentRef: forwardedContentRef }: PageContainerProps) {
  const contentRef = useRef<HTMLElement>(null)
  const { open } = useSidebar()
  const prevOpen = useRef(open)

  // One element, two observers: the width-freeze below reads it through `contentRef`,
  // and the caller receives it through the forwarded `contentRef` prop. Attaching only one of the
  // two would either break the animation or leave the caller holding null, so both are set here
  // from a single callback ref instead of racing two `ref` attributes for the same element.
  const attachContent = useCallback(
    (el: HTMLElement | null) => {
      contentRef.current = el
      if (typeof forwardedContentRef === "function") forwardedContentRef(el)
      else if (forwardedContentRef) (forwardedContentRef as React.RefObject<HTMLElement | null>).current = el
    },
    [forwardedContentRef],
  )

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
  const pageHeader = title ? <CdlPageHeader title={title} titleIcon={titleIcon} titleBadge={titleBadge} titleInfo={titleInfo} onBack={onBack} backLabel={backLabel} segments={segments} actions={actions} /> : null

  return (
    <SidebarInset className="md:peer-data-[variant=inset]:rounded-md md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:overflow-hidden min-w-0 w-0 min-h-0!">
      {showTabs ? (
        <CdlTabs
          items={navLinks}
          defaultTab={defaultTab}
          activeTab={activeTab}
          onTabChange={onTabChange}
          header={pageHeader}
          fill
          overflow={overflow}
          contentAs="main"
          contentRef={attachContent}
          contentClassName={contentClassName}
        >
          {children}
        </CdlTabs>
      ) : (
        <>
          <div className="shrink-0">{pageHeader}</div>
          {/* `ref` and `overflow-y-auto` belong to the SAME element. Separating them is a caller
              holding a ref to something adjacent to the scroller rather than to the scroller,
              with nothing to say so: `scrollTo` then throws nothing and does nothing. */}
          <main ref={attachContent} className={cn("flex-1 overflow-x-hidden flex flex-col gap-4 p-4", overflow === "hidden" ? "overflow-hidden" : "overflow-y-auto", contentClassName)}>
            {children}
          </main>
        </>
      )}
    </SidebarInset>
  )
}

export function CdlPageContainer({ sidebar, sidebarContent, sidebarFooter, hideSidebar, theme, colorMode, ...props }: PageContainerProps) {
  usePageTheme(theme)
  usePageColorMode(colorMode)
  return (
    <SidebarProvider className="h-full" style={{ minHeight: 0 }}>
      {!hideSidebar && (
        <CdlAppSidebar {...sidebar} footer={sidebarFooter}>{sidebarContent}</CdlAppSidebar>
      )}
      <PageContent {...props} />
    </SidebarProvider>
  )
}

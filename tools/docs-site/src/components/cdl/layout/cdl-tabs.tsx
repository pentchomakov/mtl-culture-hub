import React, { useId, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export interface CdlTabItem {
  /** Text shown in the tab and used as the tab's value/key. Must be unique within the set. */
  label: string
  /** Optional leading icon (e.g. a lucide-react element) rendered before the label. */
  icon?: React.ReactNode
  /** Optional trailing badge text (e.g. a count) rendered after the label. */
  badge?: string
  /** Panel content rendered automatically when this tab is active (self-contained mode). Omit on every item to render shared `children` instead. */
  content?: React.ReactNode
}

export interface CdlTabsProps {
  /** The tabs to render, in display order. */
  items: CdlTabItem[]
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
  /** Fill the parent's height: pins the bar and makes the content area scroll. Requires a height-bounded parent. Defaults to false (tabs grow with their content). */
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

export function CdlTabs({
  items,
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
            "!h-10 w-full justify-start gap-0 rounded-none border-b bg-transparent p-0 px-3 overflow-x-auto overflow-y-hidden",
            barClassName
          )}
        >
          {items.map((item) => (
            <TabsTrigger
              key={item.label}
              value={item.label}
              className="relative h-full flex-none gap-2 px-2 font-medium cursor-pointer transition-opacity duration-200 opacity-50 data-[state=active]:opacity-100 data-[state=active]:!border-b-transparent"
            >
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
              {item.label === currentTab && (
                <motion.span
                  layoutId={`${indicatorId}-tab-indicator`}
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 45, mass: 0.5 }}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <ContentTag
        ref={contentRef as React.Ref<HTMLElement>}
        className={cn(
          "flex flex-col gap-4",
          fill && cn("flex-1 overflow-x-hidden p-3", overflow === "hidden" ? "overflow-hidden" : "overflow-y-auto"),
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

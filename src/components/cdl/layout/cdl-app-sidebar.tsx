import React, { useState } from "react"
import { CaretUpDown, CaretDown as ChevronDown,Question as CircleHelp, Keyboard, SignOut as LogOut, Monitor, Moon, SidebarSimple as PanelLeftClose, SidebarSimple as PanelLeftOpen, Gear as Settings, Sun, User, UserGear as UserCog, ImageSquare as Wallpaper, type Icon as LucideIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocation } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useColorMode, type CdlColorMode } from "@/lib/use-color-mode"
import "./cdl-app-sidebar.css"

export interface CdlSidebarNavItem {
  title: string
  icon?: LucideIcon
  href?: string
  active?: boolean
  /**
   * Match `href` exactly. By default an item is current on its own path and on any path beneath it
   * ("/projects" is current on "/projects/acme"); the root "/" is always exact.
   */
  exact?: boolean
  onClick?: () => void
  badge?: string
  /**
   * Child links nested under this item. When set, the item becomes a collapsible
   * section header rather than a link — clicking it toggles the children instead
   * of navigating, so `href` and `onClick` are ignored. Nests to any depth; each
   * level is indented and gets its own guide line. Hidden in the sidebar's
   * icon-collapsed mode, where nested levels can't shrink to icons.
   */
  items?: CdlSidebarNavItem[]
  /**
   * Whether a section starts expanded. Defaults to false. Ignored unless `items`
   * is set. A section containing the active item opens automatically regardless.
   */
  defaultOpen?: boolean
}

export interface CdlSidebarNavGroup {
  label?: string
  /** Nav links rendered in the group body. Optional when `content` is provided. */
  items?: CdlSidebarNavItem[]
  /**
   * Custom content rendered in the group body — inside the same collapsible
   * region as `items`, so it collapses under the group header too. Use it for
   * groups that need more than plain nav links (e.g. a "New chat" button, a
   * search field, or a bespoke list). Renders after `items` when both are set.
   * Hidden in the sidebar's icon-collapsed mode, where free-form controls can't
   * shrink to icons.
   */
  content?: React.ReactNode
  /** Whether the group can be collapsed by the user. Defaults to true. */
  collapsible?: boolean
  /** Whether the group starts collapsed. Defaults to false. */
  defaultCollapsed?: boolean
}

export interface CdlAppSidebarProps {
  appName?: string
  appDescription?: string
  /** Brand element (e.g. a logo) shown in the expanded sidebar header in place of the default badge + app name. */
  logo?: React.ReactNode
  navGroups?: CdlSidebarNavGroup[]
  /** Nav groups always shown at the bottom of the sidebar, separated from the main nav. Use to pin global navigation in product demos that have their own navGroups. */
  pinnedNavGroups?: CdlSidebarNavGroup[]
  userEmail?: string
  userInitials?: string
  /** Replaces the nav groups. Compose `CdlAppSidebarGroup`s and `CdlAppSidebarSeparator`s, or pass any layout. */
  children?: React.ReactNode
  /** Nav links rendered in the sidebar footer, directly above the Settings row — same group, always visible. Use for a small set of global destinations (e.g. a document library) that should sit with Settings rather than scroll with the main nav. */
  footerNavItems?: CdlSidebarNavItem[]
  /** Free-form content pinned to the top of the footer, directly above `footerNavItems` and the Settings row — always visible, not scrolled with the main nav. Use for a small global note or bespoke control (e.g. a demo disclaimer). Hidden in the sidebar's icon-collapsed mode, where free-form content can't shrink to an icon. */
  footerContent?: React.ReactNode
  /** Replaces the Settings dropdown items (default: placeholders with no actions). `null` removes the Settings row. */
  settingsMenu?: React.ReactNode
  /** Replaces the user row in the footer. */
  footer?: React.ReactNode
  /**
   * Replaces the contents of the dropdown that opens from the user row at the
   * bottom of the sidebar (default: Account settings + Log out). Pass menu
   * items — e.g. a persona switcher in a demo, or a workspace list. The row
   * gains a caret to show that the identity itself can change.
   */
  userMenu?: React.ReactNode
}

const defaultNavGroups: CdlSidebarNavGroup[] = []

// Extra left padding on a section header, so it reads as one level below the
// group label above it. Its children indent further via SidebarMenuSub's own
// margin + guide line, giving three legible tiers: group → section → link.
const SECTION_INDENT = "pl-4"

// Every href in the sidebar, so a parent link ("/demo") isn't also current on a page that has a link of its own
// ("/demo/chat").
const NavHrefsContext = React.createContext<string[]>([])

function collectHrefs(items: CdlSidebarNavItem[] = [], out: string[] = []): string[] {
  for (const item of items) {
    if (item.href) out.push(item.href)
    if (item.items) collectHrefs(item.items, out)
  }
  return out
}

/**
 * Whether `href` is the current page: the same path, or (unless `exact`) a path beneath it that no other link in the
 * sidebar claims more closely. The root "/" only ever matches itself, so Home isn't current everywhere.
 */
function isCurrentPath(href: string, pathname: string, exact: boolean | undefined, all: string[]): boolean {
  if (pathname === href) return true
  if (exact || href === "/") return false
  const base = href.replace(/\/$/, "")
  if (!pathname.startsWith(base + "/")) return false
  return !all.some((other) => other.length > base.length && other !== href && (pathname === other || pathname.startsWith(other.replace(/\/$/, "") + "/")))
}

/** True when `items` (at any depth) contains the active entry. */
function hasActiveDescendant(items: CdlSidebarNavItem[], pathname: string, all: string[]): boolean {
  return items.some(
    (item) =>
      item.active ||
      (!!item.href && isCurrentPath(item.href, pathname, item.exact, all)) ||
      (!!item.items && hasActiveDescendant(item.items, pathname, all)),
  )
}

// Tooltip on the label, not the row: it reveals titles that truncate in the
// expanded sidebar. The icon-rail tooltip is SidebarMenuButton's own `tooltip`.
function NavItemTitle({ title, isCollapsed, muted = false }: { title: string; isCollapsed: boolean; muted?: boolean }) {
  const label = <span className={cn("truncate min-w-0", muted && "opacity-50")}>{title}</span>
  if (isCollapsed) return label
  return (
    <Tooltip>
      <TooltipTrigger asChild>{label}</TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  )
}

function NavItemBadge({ badge }: { badge?: string }) {
  if (!badge) return null
  return (
    <Badge variant="secondary" className="ml-auto shrink-0 rounded-sm tabular-nums group-data-[collapsible=icon]:hidden">
      {badge}
    </Badge>
  )
}

// A single link. Depth 0 renders as a top-level menu row; deeper levels render
// as sub-rows, which carry the indent and guide line and hide on the icon rail.
function NavLeaf({ item, isCollapsed, depth }: { item: CdlSidebarNavItem; isCollapsed: boolean; depth: number }) {
  const { pathname } = useLocation()
  const all = React.useContext(NavHrefsContext)
  const isActive = item.active ?? (item.href ? isCurrentPath(item.href, pathname, item.exact, all) : undefined)

  if (depth > 0) {
    return (
      <SidebarMenuSubItem>
        {item.href ? (
          <SidebarMenuSubButton asChild isActive={isActive}>
            <a href={item.href} aria-current={isActive ? "page" : undefined}>
              {item.icon && <item.icon />}
              <NavItemTitle title={item.title} isCollapsed={isCollapsed} />
              <NavItemBadge badge={item.badge} />
            </a>
          </SidebarMenuSubButton>
        ) : item.onClick ? (
          <SidebarMenuSubButton asChild isActive={isActive}>
            <button type="button" onClick={item.onClick} className="w-full cursor-pointer">
              {item.icon && <item.icon />}
              <NavItemTitle title={item.title} isCollapsed={isCollapsed} />
              <NavItemBadge badge={item.badge} />
            </button>
          </SidebarMenuSubButton>
        ) : (
          <SidebarMenuSubButton aria-disabled className="pointer-events-none">
            {item.icon && <item.icon className="opacity-50" />}
            <NavItemTitle title={item.title} isCollapsed={isCollapsed} muted />
            <NavItemBadge badge={item.badge} />
          </SidebarMenuSubButton>
        )}
      </SidebarMenuSubItem>
    )
  }

  return (
    <SidebarMenuItem>
      {item.href ? (
        <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
          <a href={item.href} aria-current={isActive ? "page" : undefined}>
            {item.icon && <item.icon />}
            <NavItemTitle title={item.title} isCollapsed={isCollapsed} />
            <NavItemBadge badge={item.badge} />
          </a>
        </SidebarMenuButton>
      ) : item.onClick ? (
        <SidebarMenuButton tooltip={item.title} isActive={item.active} onClick={item.onClick} className="cursor-pointer">
          {item.icon && <item.icon />}
          <NavItemTitle title={item.title} isCollapsed={isCollapsed} />
          <NavItemBadge badge={item.badge} />
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton tooltip={item.title} disabled className="disabled:opacity-100">
          {item.icon && <item.icon className="opacity-50" />}
          <NavItemTitle title={item.title} isCollapsed={isCollapsed} muted />
          <NavItemBadge badge={item.badge} />
        </SidebarMenuButton>
      )}
    </SidebarMenuItem>
  )
}

// An item with children: the row toggles its sub-list instead of navigating.
function NavSection({ item, isCollapsed, depth }: { item: CdlSidebarNavItem; isCollapsed: boolean; depth: number }) {
  const { pathname } = useLocation()
  const children = item.items ?? []
  const all = React.useContext(NavHrefsContext)
  const containsActive = hasActiveDescendant(children, pathname, all)

  const [open, setOpen] = useState(item.defaultOpen ?? containsActive)

  // Reveal the active page after navigation, but don't fight the user: this only
  // forces open, so a section they closed stays closed until the active item moves.
  React.useEffect(() => {
    if (containsActive) setOpen(true)
  }, [containsActive])

  const chevron = (
    <ChevronDown
      className={cn(
        "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[collapsible=icon]:hidden",
        !open && "rotate-[-90deg]",
      )}
    />
  )

  const Row = depth > 0 ? SidebarMenuSubItem : SidebarMenuItem

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Row>
        <CollapsibleTrigger asChild>
          {depth > 0 ? (
            <SidebarMenuSubButton asChild>
              <button type="button" className="w-full cursor-pointer">
                {item.icon && <item.icon />}
                <NavItemTitle title={item.title} isCollapsed={isCollapsed} />
                {chevron}
              </button>
            </SidebarMenuSubButton>
          ) : (
            <SidebarMenuButton tooltip={item.title} className={cn("cursor-pointer", SECTION_INDENT)}>
              {item.icon && <item.icon />}
              <NavItemTitle title={item.title} isCollapsed={isCollapsed} />
              {chevron}
            </SidebarMenuButton>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <SidebarMenuSub>
            <NavMenuItems items={children} isCollapsed={isCollapsed} depth={depth + 1} />
          </SidebarMenuSub>
        </CollapsibleContent>
      </Row>
    </Collapsible>
  )
}

function NavMenuItems({ items, isCollapsed, depth = 0 }: { items: CdlSidebarNavItem[]; isCollapsed: boolean; depth?: number }) {
  return (
    <>
      {items.map((item) =>
        item.items && item.items.length > 0 ? (
          <NavSection key={item.title} item={item} isCollapsed={isCollapsed} depth={depth} />
        ) : (
          <NavLeaf key={item.title} item={item} isCollapsed={isCollapsed} depth={depth} />
        ),
      )}
    </>
  )
}

export interface CdlAppSidebarGroupProps {
  /** The group to render, same shape as a `navGroups` entry. */
  group: CdlSidebarNavGroup
}

/** One nav group, for composing `children`. Render inside `CdlAppSidebar`. */
export function CdlAppSidebarGroup({ group }: CdlAppSidebarGroupProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isCollapsible = group.collapsible !== false && !!group.label
  const [open, setOpen] = useState(!group.defaultCollapsed)

  // Force open in icon mode so items remain accessible as icon buttons
  const effectiveOpen = isCollapsed || open

  const menu = group.items && group.items.length > 0 && (
    <SidebarMenu className="gap-0">
      <NavMenuItems items={group.items} isCollapsed={isCollapsed} />
    </SidebarMenu>
  )

  // Free-form content collapses with the group header, but can't render as icon
  // buttons — hide it when the sidebar is collapsed to its icon rail.
  const body = (
    <>
      {menu}
      {group.content && <div className="group-data-[collapsible=icon]:hidden">{group.content}</div>}
    </>
  )

  if (!isCollapsible) {
    return (
      <SidebarGroup data-cdl-nav-group className={cn("py-0", !isCollapsed && "pb-3")}>
        {group.label && (
          <SidebarGroupLabel>
            <span className="truncate">{group.label}</span>
          </SidebarGroupLabel>
        )}
        {body}
      </SidebarGroup>
    )
  }

  return (
    <Collapsible data-cdl-nav-group open={effectiveOpen} onOpenChange={setOpen}>
      <SidebarGroup className={cn("py-0", !isCollapsed && open && "pb-3")}>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center text-left group-data-[collapsible=icon]:pointer-events-none">
            <span className="truncate">{group.label}</span>
            <ChevronDown
              className={cn(
                "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[collapsible=icon]:hidden",
                !open && "rotate-[-90deg]"
              )}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          {body}
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

/** Rule between nav groups in `children`; the same one drawn above `pinnedNavGroups`. */
export function CdlAppSidebarSeparator() {
  return (
    <SidebarGroup data-cdl-nav-separator className="py-3">
      <SidebarSeparator className="mx-0" />
    </SidebarGroup>
  )
}

export function CdlAppSidebar({
  appName = "Compass Data + AI",
  appDescription,
  logo,
  navGroups = defaultNavGroups,
  pinnedNavGroups,
  userEmail = "jerry.zhu@compassdata.ca",
  userInitials = "JZ",
  children,
  footerNavItems,
  footerContent,
  settingsMenu,
  footer,
  userMenu,
}: CdlAppSidebarProps) {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { mode, setMode } = useColorMode()

  const allHrefs = React.useMemo(() => [...collectHrefs(navGroups.flatMap((g) => g.items ?? [])), ...collectHrefs(pinnedNavGroups?.flatMap((g) => g.items ?? [])), ...collectHrefs(footerNavItems)], [navGroups, pinnedNavGroups, footerNavItems])

  return (
    <NavHrefsContext.Provider value={allHrefs}>
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <SidebarMenuButton size="lg" onClick={toggleSidebar} tooltip="Expand sidebar" className="justify-center">
                <span className="inline-flex animate-icon-in"><PanelLeftOpen className="size-4" /></span>
              </SidebarMenuButton>
            ) : (
              <div className="flex h-12 w-full items-center gap-2">
                {logo ? (
                  <div className="flex flex-1 items-center min-w-0 overflow-hidden">{logo}</div>
                ) : (
                  <>
                    <div className="flex aspect-square size-6 items-center justify-center rounded bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                      <span className="text-[9px] font-bold">TN</span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-medium">{appName}</span>
                      {appDescription && <span className="truncate text-xs text-muted-foreground">{appDescription}</span>}
                    </div>
                  </>
                )}
                <button
                  onClick={toggleSidebar}
                  className="flex cursor-pointer items-center justify-center rounded-sm p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors shrink-0"
                >
                  <span className="inline-flex animate-icon-in"><PanelLeftClose className="size-4 text-muted-foreground" /></span>
                </button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {children ?? navGroups.map((group, i) => (
          <CdlAppSidebarGroup key={group.label ?? i} group={group} />
        ))}
        {pinnedNavGroups && pinnedNavGroups.length > 0 && (
          <>
            {(children != null || navGroups.length > 0) && <CdlAppSidebarSeparator />}
            {pinnedNavGroups.map((group) => (
              <CdlAppSidebarGroup key={group.label} group={group} />
            ))}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {footer ?? (
          <SidebarMenu>
            {footerContent && (
              <SidebarMenuItem className="pb-1 group-data-[collapsible=icon]:hidden">
                {footerContent}
              </SidebarMenuItem>
            )}
            {footerNavItems && footerNavItems.length > 0 && (
              <NavMenuItems items={footerNavItems} isCollapsed={isCollapsed} />
            )}
            {settingsMenu !== null && (
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip="Settings" className="cursor-pointer">
                      <Settings className="size-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="min-w-(--radix-popper-anchor-width)">
                    {settingsMenu ?? (
                      <>
                        <DropdownMenuItem className="cursor-pointer text-sm">
                          <User className="size-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-sm">
                          <UserCog className="size-4" />
                          <span>Account</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-sm">
                          <Keyboard className="size-4" />
                          <span>Keyboard shortcuts</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-sm">
                          <CircleHelp className="size-4" />
                          <span>Help</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <div className="flex h-8 w-full items-center gap-2 px-2 text-sm">
                <Wallpaper className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">Theme</span>
                {(() => {
                  const themeOptions = [
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "system", label: "Auto", icon: Monitor },
                  ] as const
                  const activeIndex = themeOptions.findIndex(opt => opt.value === mode)
                  return (
                    <div
                      role="radiogroup"
                      aria-label="Theme"
                      className="relative flex items-center gap-0 rounded-lg border border-border bg-muted p-[3px] group-data-[collapsible=icon]:hidden"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[3px] left-[3px] h-5 w-6 rounded-md border border-transparent bg-background shadow-sm transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ transform: `translateX(${activeIndex * 1.5}rem)` }}
                      />
                      {themeOptions.map(({ value, label, icon: Icon }) => {
                        const active = mode === value
                        return (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={label}
                            onClick={() => setMode(value as CdlColorMode)}
                            className={cn(
                              "relative z-10 flex h-5 w-6 cursor-pointer items-center justify-center rounded-md outline-none transition-colors duration-[220ms] focus-visible:ring-2 focus-visible:ring-ring",
                              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Icon className="size-3" />
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem className="pt-3 pb-1.5">
              <SidebarSeparator className="mx-0" />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={userEmail} className="cursor-pointer">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-foreground">
                      {userInitials}
                    </span>
                    <span className="truncate">{userEmail}</span>
                    {userMenu && (
                      <CaretUpDown className="ml-auto size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    )}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="min-w-(--radix-popper-anchor-width)">
                  {userMenu ?? (
                    <>
                      <DropdownMenuItem className="cursor-pointer text-sm">
                        <UserCog className="size-4" />
                        <span>Account settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" className="cursor-pointer text-sm">
                        <LogOut className="size-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
    </NavHrefsContext.Provider>
  )
}

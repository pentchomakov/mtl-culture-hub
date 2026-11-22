import React, { useState } from "react"
import { CaretDown as ChevronDown, Question as CircleHelp, Keyboard, Monitor, Moon, SidebarSimple as PanelLeftClose, SidebarSimple as PanelLeftOpen, Gear as Settings, Sun, User, UserGear as UserCog, ImageSquare as Wallpaper, type Icon as LucideIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocation } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  onClick?: () => void
  badge?: string
}

export interface CdlSidebarNavGroup {
  label?: string
  /** Nav links rendered in the group body. Optional when `content` is provided. */
  items?: CdlSidebarNavItem[]
  /**
   * Custom content rendered in the group body, inside the same collapsible
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
  /** Replaces the nav groups in the content area. Use for fully custom sidebar layouts. */
  children?: React.ReactNode
  /** Nav links rendered in the sidebar footer, directly above the Settings row: same group, always visible. Use for a small set of global destinations (e.g. a document library) that should sit with Settings rather than scroll with the main nav. */
  footerNavItems?: CdlSidebarNavItem[]
  /** Free-form content pinned to the top of the footer, directly above `footerNavItems` and the Settings row: always visible, not scrolled with the main nav. Use for a small global note or bespoke control (e.g. a demo disclaimer). Hidden in the sidebar's icon-collapsed mode, where free-form content can't shrink to an icon. */
  footerContent?: React.ReactNode
  /** Replaces the user row in the footer. */
  footer?: React.ReactNode
  /**
   * Hides the Settings row in the footer, keeping the Theme control and the user row.
   *
   * ── LOCAL DIVERGENCE FROM THE CDL REGISTRY ────────────────────────────────
   * Not upstream. Added for the docs portal, which has no settings to offer: Profile,
   * Account, Keyboard shortcuts and Help are all inert on a read-only viewer, and a
   * menu that advertises functions the product doesn't have is worse than no menu. The
   * alternative CDL already offers is `footer`, which replaces the **entire** footer and
   * would take the Theme control and the user row with it, forking the two pieces most
   * likely to drift from the design system.
   *
   * `npx shadcn add …/r/cdl-app-sidebar.json` OVERWRITES this file and silently drops
   * this prop; the portal shell then shows a Settings menu again. If that happens,
   * re-apply this block, or upstream it to compass-design-library and delete this note.
   */
  hideSettings?: boolean
  /*
   * The user-menu prop USED TO LIVE HERE AND ITS ABSENCE IS LOAD-BEARING.
   *
   * The user row is always plain and non-interactive: initials plus email, no dropdown.
   * A portal like this one has no session of its own to manage, so the two items in that
   * menu had no handler and nothing an app-level control could do. The identity is worth
   * *showing* (it says which account the page is served to), so the row stays and only
   * the menu is gone.
   *
   * It was a prop once, set to hide the menu, and a later sandbox flipped it back for a
   * reason that made sense at the time. A removal that is only a setting comes back. So
   * the branch is deleted rather than switched off, which makes passing the prop a type
   * error rather than a silently ignored option.
   */
  /**
   * Drops the "Auto" (follow-the-OS) option from the theme control, leaving Light and
   * Dark.
   *
   * Same local divergence and caveat as {@link hideSettings}. **Auto is not a dead
   * control**: `useColorMode` resolves it from `prefers-color-scheme` and subscribes to
   * changes, so the page follows the OS live, with no reload, and the choice persists.
   * This prop exists only for a surface that would rather offer an explicit two-way
   * choice than a third mode to reason about. If the stored mode is `system` while this
   * is set, the indicator sits on whichever of Light/Dark is currently resolved, so the
   * control never renders with nothing selected.
   */
  hideAutoTheme?: boolean
}

const defaultNavGroups: CdlSidebarNavGroup[] = []

function NavMenuItems({ items, isCollapsed }: { items: CdlSidebarNavItem[]; isCollapsed: boolean }) {
  const { pathname } = useLocation()

  const itemTitle = (title: string, extra?: string) =>
    !isCollapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`truncate min-w-0${extra ? ` ${extra}` : ""}`}>{title}</span>
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    ) : (
      <span className={`truncate min-w-0${extra ? ` ${extra}` : ""}`}>{title}</span>
    )

  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          {item.href ? (
            <SidebarMenuButton asChild tooltip={item.title} isActive={item.active ?? pathname === item.href}>
              <a href={item.href}>
                {item.icon && <item.icon />}
                {itemTitle(item.title)}
                {item.badge && <Badge variant="secondary" className="ml-auto shrink-0 rounded-sm tabular-nums group-data-[collapsible=icon]:hidden">{item.badge}</Badge>}
              </a>
            </SidebarMenuButton>
          ) : item.onClick ? (
            <SidebarMenuButton tooltip={item.title} isActive={item.active} onClick={item.onClick} className="cursor-pointer">
              {item.icon && <item.icon />}
              {itemTitle(item.title)}
              {item.badge && <Badge variant="secondary" className="ml-auto shrink-0 rounded-sm tabular-nums group-data-[collapsible=icon]:hidden">{item.badge}</Badge>}
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton tooltip={item.title} disabled className="disabled:opacity-100">
              {item.icon && <item.icon className="opacity-50" />}
              {itemTitle(item.title, "opacity-50")}
              {item.badge && <Badge variant="secondary" className="ml-auto shrink-0 rounded-sm tabular-nums group-data-[collapsible=icon]:hidden">{item.badge}</Badge>}
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </>
  )
}

function NavGroup({ group, isCollapsed, suppressBottomPad = false }: { group: CdlSidebarNavGroup; isCollapsed: boolean; suppressBottomPad?: boolean }) {
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
  // buttons. Hide it when the sidebar is collapsed to its icon rail.
  const body = (
    <>
      {menu}
      {group.content && <div className="group-data-[collapsible=icon]:hidden">{group.content}</div>}
    </>
  )

  if (!isCollapsible) {
    return (
      <SidebarGroup className={cn("py-0", !isCollapsed && !suppressBottomPad && "pb-3")}>
        {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
        {body}
      </SidebarGroup>
    )
  }

  return (
    <Collapsible open={effectiveOpen} onOpenChange={setOpen}>
      <SidebarGroup className={cn("py-0", !isCollapsed && open && !suppressBottomPad && "pb-3")}>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center group-data-[collapsible=icon]:pointer-events-none">
            {group.label}
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

/** First letters of up to two words, for the default header badge. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "··"
  return words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("")
}

export function CdlAppSidebar({
  // ── LOCAL DIVERGENCE FROM THE CDL REGISTRY: the three defaults below ──────────
  // Upstream ships the CDL demo's own identity here (an app name, a named colleague's
  // email address and their initials). Those are fine in a demo and wrong in a kit that
  // scaffolds into someone else's repo: a portal nobody configured would greet its
  // reader with a Compass employee's address. Generalised rather than deleted, because
  // the row itself is CDL's and the props still let a caller set a real identity.
  appName = "Docs",
  appDescription,
  logo,
  navGroups = defaultNavGroups,
  pinnedNavGroups,
  userEmail = "Local docs portal",
  userInitials = "DP",
  children,
  footerNavItems,
  footerContent,
  footer,
  hideSettings,
  hideAutoTheme,
}: CdlAppSidebarProps) {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { mode, resolvedMode, setMode } = useColorMode()

  return (
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
                      {/* Same local divergence as the defaults above: upstream hardcodes the
                          demo's own two letters here, which read as a stray label in any other
                          app. Derived from `appName` so a scaffolded project is right by default. */}
                      <span className="text-[9px] font-bold">{initialsOf(appName)}</span>
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
          <NavGroup
            key={group.label ?? i}
            group={group}
            isCollapsed={isCollapsed}
            suppressBottomPad={!!pinnedNavGroups?.length && i === navGroups.length - 1}
          />
        ))}
        {pinnedNavGroups && pinnedNavGroups.length > 0 && (
          <>
            {(children != null || navGroups.length > 0) && (
              <SidebarGroup className="py-3">
                <SidebarSeparator className="mx-0" />
              </SidebarGroup>
            )}
            {pinnedNavGroups.map((group) => (
              <NavGroup key={group.label} group={group} isCollapsed={isCollapsed} />
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
            {/* `hideSettings` is a local addition. See the prop's doc comment. Not
                rendered at all rather than hidden with CSS, so the dropdown never
                mounts and nothing reaches the accessibility tree. */}
            {!hideSettings && (
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton tooltip="Settings" className="cursor-pointer">
                      <Settings className="size-4" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="min-w-(--radix-popper-anchor-width)">
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <div className="flex h-8 w-full items-center gap-2 px-2 text-sm">
                <Wallpaper className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">Theme</span>
                {(() => {
                  const allOptions = [
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "light", label: "Light", icon: Sun },
                    { value: "system", label: "Auto", icon: Monitor },
                  ] as const
                  // `hideAutoTheme` is a local addition. See the prop's doc comment.
                  const themeOptions = hideAutoTheme
                    ? allOptions.filter((o) => o.value !== "system")
                    : allOptions
                  // With Auto hidden, a previously-stored `system` mode matches nothing,
                  // which would leave the sliding indicator parked at index -1. Fall back
                  // to whichever mode `system` currently resolves to.
                  const shown = hideAutoTheme && mode === "system" ? resolvedMode : mode
                  const activeIndex = Math.max(0, themeOptions.findIndex(opt => opt.value === shown))
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
                        const active = shown === value
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
            {/* Always plain: nothing in this row is clickable. See the note above. */}
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={userEmail} asChild>
                <div className="cursor-default">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[8px] font-medium text-foreground">
                    {userInitials}
                  </span>
                  <span className="truncate">{userEmail}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

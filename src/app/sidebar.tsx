import { House } from '@phosphor-icons/react'
import type { CdlAppSidebarProps } from '@/components/cdl/layout/cdl-app-sidebar'

// A factory rather than a component so a page can compose it: spread the result and override what it needs.
export function createSidebar(): CdlAppSidebarProps {
  return {
    logo: (
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground">
          MCH
        </div>
        <span className="text-sm font-medium">MTL Culture Hub</span>
      </div>
    ),
    appName: 'MTL Culture Hub',
    navGroups: [
      {
        items: [{ title: 'Overview', icon: House, href: '/overview' }],
      },
    ],
    footerContent: null,
    footerNavItems: [],
    userEmail: 'you@example.com',
    userInitials: 'ME',
  }
}

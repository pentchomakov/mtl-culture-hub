import { Sparkle } from '@phosphor-icons/react'
import { CdlPageContainer } from '@/components/cdl/layout/cdl-page-container'
import { CdlBlockGroup } from '@/components/cdl/layout/cdl-block-group'
import { CdlKpiCard } from '@/components/cdl/display/cdl-kpi-card'
import { CdlEmptyState } from '@/components/cdl/display/cdl-empty-state'
import { createSidebar } from '@/app/sidebar'

export default function OverviewPage() {
  return (
    <CdlPageContainer
      title="Overview"
      description="Placeholder landing page for MTL Culture Hub."
      sidebar={createSidebar()}
    >
      <CdlBlockGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CdlKpiCard header="Metric one" value="—" />
          <CdlKpiCard header="Metric two" value="—" />
          <CdlKpiCard header="Metric three" value="—" />
        </div>
        <CdlEmptyState
          icon={Sparkle}
          title="Nothing here yet"
          description="Add your first page: create it under src/pages and link it from src/app/sidebar.tsx."
        />
      </CdlBlockGroup>
    </CdlPageContainer>
  )
}

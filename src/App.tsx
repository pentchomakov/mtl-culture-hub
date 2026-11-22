import { Navigate, Route, Routes } from 'react-router-dom'
import { Agentation } from 'agentation'
import { TooltipProvider } from '@/components/ui/tooltip'
import OverviewPage from '@/pages/overview'

export default function App() {
  return (
    <TooltipProvider>
      <div data-theme="compass" className="h-full bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </div>
      {/* Agentation: annotate UI elements and copy structured context for AI agents.
          Dev-only — import.meta.env.DEV is false in production builds, so this is tree-shaken out. */}
      {import.meta.env.DEV && <Agentation />}
    </TooltipProvider>
  )
}

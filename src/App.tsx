import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { Markets } from '@/pages/Markets'
import { Pipeline } from '@/pages/Pipeline'
import { StockDetail } from '@/pages/StockDetail'
import { WatchlistPage } from '@/pages/WatchlistPage'
import { AgentPage } from '@/pages/AgentPage'

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock/:ticker" element={<StockDetail />} />
        <Route path="/agente" element={<AgentPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

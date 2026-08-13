import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { AgentChatProvider } from './context/AgentChatContext'
import { AnalysisProvider } from './context/AnalysisContext'
import { WatchlistProvider } from './context/WatchlistContext'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el elemento #root')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <WatchlistProvider>
        <AnalysisProvider>
          <AgentChatProvider>
            <App />
          </AgentChatProvider>
        </AnalysisProvider>
      </WatchlistProvider>
    </BrowserRouter>
  </StrictMode>,
)

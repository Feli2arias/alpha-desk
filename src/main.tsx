import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { ChatDockProvider } from './context/ChatDockContext'
import { WatchlistProvider } from './context/WatchlistContext'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró el elemento #root')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <WatchlistProvider>
        <ChatDockProvider>
          <App />
        </ChatDockProvider>
      </WatchlistProvider>
    </BrowserRouter>
  </StrictMode>,
)

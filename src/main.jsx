import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SalesProvider } from './context/SalesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <SalesProvider>
        <App />
      </SalesProvider>
    </HashRouter>
  </StrictMode>,
)

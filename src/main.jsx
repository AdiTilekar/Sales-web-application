import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SalesProvider } from './context/SalesContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SalesProvider>
        <App />
      </SalesProvider>
    </BrowserRouter>
  </StrictMode>,
)

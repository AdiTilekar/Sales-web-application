import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useSales } from './context/SalesContext'
import AddSale from './pages/AddSale'
import Dashboard from './pages/Dashboard'
import FlavorAnalysis from './pages/FlavorAnalysis'
import History from './pages/History'

function App() {
  const { isLoading, syncStatus, lastSyncError } = useSales()

  return (
    <div className="app-shell">
      <Navbar />
      {syncStatus === 'degraded' ? (
        <section className="glass-card sync-alert" role="alert" aria-live="assertive">
          <p>
            Cloud sync is failing. New sales are saved locally on this device only.
            {lastSyncError ? ` Error: ${lastSyncError}` : ''}
          </p>
        </section>
      ) : null}
      <main className="app-main">
        {isLoading ? (
          <section className="page page-enter">
            <div className="glass-card mobile-help">
              <p>Loading sales data...</p>
            </div>
          </section>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/add" replace />} />
            <Route path="/add" element={<AddSale />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/flavors" element={<FlavorAnalysis />} />
            <Route path="*" element={<Navigate to="/add" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App

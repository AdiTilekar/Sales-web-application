import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useSales } from './context/SalesContext'
import AddSale from './pages/AddSale'
import Dashboard from './pages/Dashboard'
import FlavorAnalysis from './pages/FlavorAnalysis'
import History from './pages/History'
import PurchaseOrder from './pages/PurchaseOrder'
import Records from './pages/Records'
import Reports from './pages/Reports'

const ROUTE_TITLES = {
  '/add': 'Add Sale',
  '/dashboard': 'Dashboard',
  '/records': 'Records',
  '/history': 'History',
  '/reports': 'Reports',
  '/flavors': 'Flavor Analysis',
  '/purchase-order': 'Purchase Order',
  '/po': 'Purchase Order',
}

function App() {
  const { isLoading, syncStatus, lastSyncError } = useSales()
  const location = useLocation()

  useEffect(() => {
    const pageTitle = ROUTE_TITLES[location.pathname] || 'Sales App'
    document.title = `${pageTitle} – Shree Ganesh Kulfi`
  }, [location.pathname])

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
            <div className="glass-card loading-card">
              <p>🍦 Loading Shree Ganesh Kulfi data...</p>
            </div>
          </section>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/add" replace />} />
            <Route path="/add" element={<AddSale />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records" element={<Records />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/flavors" element={<FlavorAnalysis />} />
            <Route path="/purchase-order" element={<PurchaseOrder />} />
            <Route path="/po" element={<Navigate to="/purchase-order" replace />} />
            <Route path="*" element={<Navigate to="/add" replace />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App

import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import AddSale from './pages/AddSale'
import Dashboard from './pages/Dashboard'
import FlavorAnalysis from './pages/FlavorAnalysis'
import Records from './pages/Records'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/add" replace />} />
          <Route path="/add" element={<AddSale />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/records" element={<Records />} />
          <Route path="/flavors" element={<FlavorAnalysis />} />
          <Route path="*" element={<Navigate to="/add" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

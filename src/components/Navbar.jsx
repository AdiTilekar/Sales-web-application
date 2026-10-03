import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LOGO_URL } from '../data/products'
import { useSales } from '../context/SalesContext'
import ShopSelector from './ShopSelector'
import { handleImageError, LOGO_FALLBACK_IMAGE } from '../utils/image'

const Navbar = () => {
  const { syncStatus, lastSyncError } = useSales()
  const location = useLocation()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [prevPath, setPrevPath] = useState(location.pathname)

  // Close more menu when route changes
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname)
    setIsMoreOpen(false)
  }

  const statusLabel =
    syncStatus === 'cloud'
      ? 'Cloud Sync OK'
      : syncStatus === 'checking'
        ? 'Checking Sync'
        : syncStatus === 'degraded'
          ? 'Cloud Issue (Local Saved)'
          : 'Fallback Local'

  const statusClass =
    syncStatus === 'cloud'
      ? 'online'
      : syncStatus === 'checking'
        ? 'checking'
        : syncStatus === 'degraded'
          ? 'degraded'
          : 'local'

  const isMoreActive = ['/flavors', '/history', '/purchase-order'].includes(location.pathname)

  return (
    <>
      <header className="navbar glass-card">
        <div className="brand-wrap">
          <img
            src={LOGO_URL}
            alt="Shree Ganesh Kulfi"
            className="brand-logo"
            onError={(event) => handleImageError(event, LOGO_FALLBACK_IMAGE)}
          />
          <h1 className="brand-name">Shree Ganesh Kulfi</h1>
          <span
            className={`sync-badge ${statusClass}`}
            role="status"
            aria-live="polite"
            title={lastSyncError ? `${statusLabel}: ${lastSyncError}` : statusLabel}
          >
            <span className="dot" aria-hidden="true" />
            <span className="sync-text">{statusLabel}</span>
          </span>
        </div>

        <ShopSelector />

        <nav className="nav-links desktop-nav-links" aria-label="Main navigation">
          <NavLink to="/add">Add Sale</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/records">Records</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/flavors">Flavor Analysis</NavLink>
          <NavLink to="/purchase-order">Purchase Order</NavLink>
        </nav>
      </header>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        <NavLink to="/add" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="tab-label">Add Sale</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          <span className="tab-label">Dashboard</span>
        </NavLink>

        <NavLink to="/records" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="tab-label">Records</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `bottom-tab ${isActive ? 'active' : ''}`}>
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="tab-label">Reports</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-tab ${isMoreActive || isMoreOpen ? 'active' : ''}`}
          onClick={() => setIsMoreOpen((prev) => !prev)}
          aria-expanded={isMoreOpen}
          aria-label="More options"
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
            <circle cx="5" cy="12" r="1.5" />
          </svg>
          <span className="tab-label">More</span>
        </button>
      </nav>

      {/* More Options Mobile Drawer */}
      {isMoreOpen ? (
        <div className="mobile-more-backdrop" onClick={() => setIsMoreOpen(false)}>
          <div className="glass-card mobile-more-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-more-header">
              <h3>More Navigation</h3>
              <button type="button" className="close-btn" onClick={() => setIsMoreOpen(false)}>✕</button>
            </div>
            <div className="mobile-more-links">
              <NavLink to="/purchase-order" className={({ isActive }) => `more-link-item ${isActive ? 'active' : ''}`}>
                <span className="more-link-icon">📦</span>
                <div>
                  <strong>Purchase Order</strong>
                  <small>Create & send stock orders to factory</small>
                </div>
              </NavLink>
              <NavLink to="/history" className={({ isActive }) => `more-link-item ${isActive ? 'active' : ''}`}>
                <span className="more-link-icon">📜</span>
                <div>
                  <strong>History Archive</strong>
                  <small>View past days sales data</small>
                </div>
              </NavLink>
              <NavLink to="/flavors" className={({ isActive }) => `more-link-item ${isActive ? 'active' : ''}`}>
                <span className="more-link-icon">🍦</span>
                <div>
                  <strong>Flavor Analysis</strong>
                  <small>Flavor demand breakdown & volume</small>
                </div>
              </NavLink>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Navbar

import { NavLink } from 'react-router-dom'
import { LOGO_URL } from '../data/products'
import { handleImageError, LOGO_FALLBACK_IMAGE } from '../utils/image'

const Navbar = () => {
  return (
    <header className="navbar glass-card">
      <div className="brand-wrap">
        <img
          src={LOGO_URL}
          alt="Shree Ganesh Kulfi"
          className="brand-logo"
          onError={(event) => handleImageError(event, LOGO_FALLBACK_IMAGE)}
        />
        <h1 className="brand-name">🍦 Shree Ganesh Kulfi</h1>
      </div>

      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/add">Add Sale</NavLink>
        <NavLink to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/flavors">Flavor Analysis</NavLink>
      </nav>
    </header>
  )
}

export default Navbar

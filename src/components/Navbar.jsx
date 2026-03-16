import { NavLink } from 'react-router-dom'
import { LOGO_URL } from '../data/products'

const Navbar = () => {
  return (
    <header className="navbar glass-card">
      <div className="brand-wrap">
        <img src={LOGO_URL} alt="Shree Ganesh Kulfi" className="brand-logo" />
        <h1 className="brand-name">🍦 Shree Ganesh Kulfi</h1>
      </div>

      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/add">Add Sale</NavLink>
        <NavLink to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink to="/records">Records</NavLink>
        <NavLink to="/flavors">Flavor Analysis</NavLink>
      </nav>
    </header>
  )
}

export default Navbar

import { NavLink } from 'react-router-dom'

const ViewModeSwitch = () => {
  return (
    <div className="glass-card view-mode-switch" aria-label="Today and history switch">
      <NavLink to="/records">Today</NavLink>
      <NavLink to="/history">History</NavLink>
    </div>
  )
}

export default ViewModeSwitch
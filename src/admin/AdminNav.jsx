import { NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

function linkClass({ isActive }) {
  return isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'
}

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      <div className="admin-nav__links">
        <NavLink to="/admin" end className={linkClass}>
          Notaries
        </NavLink>
      </div>
      <button className="admin-btn" onClick={() => signOut(auth)}>
        Sign out
      </button>
    </nav>
  )
}

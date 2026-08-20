import { NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import Icon from '../components/Icon'

function linkClass({ isActive }) {
  return isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'
}

export default function AdminNav() {
  return (
    <header className="admin-nav">
      <div className="admin-nav__inner">
        <div className="admin-nav__brand">
          <span className="admin-nav__mark">
            <Icon name="seal" size={17} />
          </span>
          <span className="admin-nav__wordmark">
            NotaryHost <em>Admin</em>
          </span>
        </div>
        <nav className="admin-nav__links">
          <NavLink to="/admin" end className={linkClass}>
            Notaries
          </NavLink>
          <NavLink to="/admin/envelopes" className={linkClass}>
            Envelopes
          </NavLink>
          <NavLink to="/admin/twilio-spend" className={linkClass}>
            Twilio spend
          </NavLink>
        </nav>
        <button className="admin-btn admin-btn--ghost" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </div>
    </header>
  )
}

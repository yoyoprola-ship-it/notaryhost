import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'

const links = [
  { href: '#top', label: 'Home', icon: 'seal' },
  { href: '#services', label: 'Services', icon: 'check' },
  { href: '#website', label: 'Website', icon: 'globe' },
  { href: '#confirmations', label: 'Confirmations', icon: 'bell' },
  { href: '#how-it-works', label: 'Phone robot (IVR)', icon: 'mic' },
  { href: '#mobile-dispatch', label: 'Mobile dispatch', icon: 'truck' },
  { href: '#dashboard', label: 'Dashboard', icon: 'gauge' },
  { href: '#tech', label: 'Technology', icon: 'cloud' },
  { href: '#who-for', label: "Who it's for", icon: 'scale' },
  { href: '#included', label: "What's included", icon: 'file' },
  { href: '#benefits', label: 'Benefits', icon: 'rocket' },
  { href: '#results', label: 'Results', icon: 'pulse' },
  { href: '/notaries', label: 'Notary directory', icon: 'pin' },
  { href: '#referrals', label: 'Referrals', icon: 'seal' },
  { href: '#pricing', label: 'Pricing', icon: 'dollar' },
  { href: '#comparison', label: 'Comparison', icon: 'transfer' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <header className="site-nav site-nav--banner">
      <a className="site-nav__banner-link" href="#top" aria-label="NotaryHost — home">
        <img className="site-nav__banner-img" src="/notaryhost-nav-banner.png" alt="Notary Host" />
      </a>

      <div className="section-inner site-nav__inner">
        <button
          type="button"
          className="site-nav__toggle"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`site-nav__overlay ${open ? 'site-nav__overlay--open' : ''}`} onClick={() => setOpen(false)} />

      <nav className={`site-nav__drawer ${open ? 'site-nav__drawer--open' : ''}`} aria-hidden={!open}>
        <div className="site-nav__drawer-header">
          <span className="brand">
            <span className="brand__mark">
              <Icon name="seal" size={18} />
            </span>
            <span>NotaryHost</span>
          </span>
          <button
            type="button"
            className="site-nav__drawer-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <ul className="site-nav__drawer-list">
          {links.map((link) => {
            const content = (
              <>
                <span className="site-nav__drawer-icon">
                  <Icon name={link.icon} size={17} />
                </span>
                {link.label}
              </>
            )
            return (
              <li key={link.href}>
                {link.href.startsWith('/') ? (
                  <Link to={link.href} onClick={() => setOpen(false)}>{content}</Link>
                ) : (
                  <a href={link.href} onClick={() => setOpen(false)}>{content}</a>
                )}
              </li>
            )
          })}
        </ul>

        <a href="#contact" className="btn btn--primary site-nav__drawer-cta" onClick={() => setOpen(false)}>
          Reserve your spot
        </a>

        <div className="site-nav__drawer-legal">
          <Link to="/privacy" onClick={() => setOpen(false)}>Privacy Policy</Link>
          <Link to="/terms" onClick={() => setOpen(false)}>Terms &amp; Conditions</Link>
        </div>
      </nav>
    </header>
  )
}

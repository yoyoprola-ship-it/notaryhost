import { useState } from 'react'
import Icon from './Icon'

const links = [
  { href: '#top', label: 'Home' },
  { href: '#services', label: 'Services' },
  { href: '#website', label: 'Website' },
  { href: '#confirmations', label: 'Confirmations' },
  { href: '#how-it-works', label: 'Phone robot (IVR)' },
  { href: '#dashboard', label: 'Dashboard' },
  { href: '#tech', label: 'Technology' },
  { href: '#who-for', label: "Who it's for" },
  { href: '#included', label: "What's included" },
  { href: '#benefits', label: 'Benefits' },
  { href: '#results', label: 'Results' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#comparison', label: 'Comparison' },
  { href: '#contact', label: 'Get in touch' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="site-nav">
      <div className="section-inner site-nav__inner">
        <a className="brand" href="#top">
          <span className="brand__mark">
            <Icon name="seal" size={18} />
          </span>
          <span>NotaryHost</span>
        </a>

        <button
          type="button"
          className="site-nav__toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {open && (
        <div className="site-nav__mobile">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}

import { useState } from 'react'
import Icon from './Icon'

const links = [
  { href: '#services', label: 'Services' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#results', label: 'Results' },
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

        <ul className="site-nav__links">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        <div className="site-nav__actions">
          <a className="btn btn--ghost" href="#contact">
            Get in touch
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
            <li>
              <a href="#contact" onClick={() => setOpen(false)}>
                Get in touch
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

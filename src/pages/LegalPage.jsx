import { Link } from 'react-router-dom'
import Footer from '../sections/Footer'

export default function LegalPage({ title, updated, children }) {
  return (
    <div className="page">
      <header className="site-nav">
        <div className="section-inner site-nav__inner">
          <Link className="brand" to="/">
            <span>NotaryHost</span>
          </Link>
        </div>
      </header>

      <section className="section">
        <div className="section-inner section-inner--narrow legal">
          <p className="eyebrow">Legal</p>
          <h1 className="legal__title">{title}</h1>
          <p className="legal__updated">Last updated: {updated}</p>
          <div className="legal__body">{children}</div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

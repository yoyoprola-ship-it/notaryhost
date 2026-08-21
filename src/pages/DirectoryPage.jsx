import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import Icon from '../components/Icon'
import Footer from '../sections/Footer'
import usePageMeta from '../lib/usePageMeta'

export default function DirectoryPage() {
  const [notaries, setNotaries] = useState(null)
  const [error, setError] = useState('')

  const structuredData = useMemo(() => {
    if (!notaries || notaries.length === 0) return undefined
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: notaries.map((n, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: n.businessName,
        url: `https://${n.slug}.notaryhost.com`,
      })),
    }
  }, [notaries])

  usePageMeta({
    title: 'Notary Directory — NotaryHost',
    description:
      'Browse notaries running their own bilingual website, booking system, and phone line — built and hosted by NotaryHost.',
    url: 'https://notaryhost.com/notaries',
    structuredData,
  })

  useEffect(() => {
    getDocs(collection(db, 'publicNotaryProfiles'))
      .then((snap) => {
        const rows = snap.docs
          .map((d) => ({ slug: d.id, ...d.data() }))
          .filter((n) => n.status === 'active')
          .sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''))
        setNotaries(rows)
      })
      .catch(() => setError('Could not load the directory.'))
  }, [])

  return (
    <div className="page">
      <header className="site-nav">
        <div className="section-inner site-nav__inner">
          <Link className="brand" to="/">
            <span className="brand__mark">
              <Icon name="seal" size={18} />
            </span>
            <span>NotaryHost</span>
          </Link>
        </div>
      </header>

      <section className="section">
        <div className="section-inner">
          <p className="eyebrow">Directory</p>
          <h1 className="section__title">Notaries on NotaryHost</h1>
          <p className="section__lead">
            Real notaries, running their own bilingual website, booking system, and phone line —
            built and hosted by us.
          </p>

          {error && <p className="directory__error">{error}</p>}

          {!notaries && !error && <p className="directory__loading">Loading…</p>}

          {notaries && notaries.length === 0 && (
            <p className="directory__loading">No notaries listed yet — check back soon.</p>
          )}

          {notaries && notaries.length > 0 && (
            <div className="grid grid--3">
              {notaries.map((n) => (
                <a
                  key={n.slug}
                  className="directory-card"
                  href={`https://${n.slug}.notaryhost.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {n.photoUrl ? (
                    <img
                      className="directory-card__photo"
                      src={n.photoUrl}
                      alt={n.businessName}
                      style={{
                        objectPosition: `${(n.photoCropX ?? 0.5) * 100}% ${(n.photoCropY ?? 0.5) * 100}%`,
                        transform: `scale(${n.photoCropZoom ?? 1})`,
                      }}
                    />
                  ) : (
                    <div className="directory-card__photo directory-card__photo--placeholder">
                      <Icon name="seal" size={28} />
                    </div>
                  )}
                  <div className="directory-card__body">
                    <h3 className="directory-card__name">{n.businessName}</h3>
                    <p className="directory-card__desc">
                      {n.location && <strong>{n.location}. </strong>}
                      {n.description}
                    </p>
                    <span className="directory-card__link">
                      Visit site <Icon name="arrow" size={14} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

export default function Directory() {
  const [notaries, setNotaries] = useState(null)

  useEffect(() => {
    getDocs(collection(db, 'publicNotaryProfiles'))
      .then((snap) => {
        const rows = snap.docs
          .map((d) => ({ slug: d.id, ...d.data() }))
          .filter((n) => n.status === 'active')
          .sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''))
        setNotaries(rows)
      })
      .catch(() => setNotaries([]))
  }, [])

  if (notaries && notaries.length === 0) return null

  return (
    <section className="section" id="notaries">
      <div className="section-inner">
        <Reveal>
          <p className="eyebrow">Notary directory</p>
          <h2 className="section__title">Notaries already on NotaryHost</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            Real notaries, running their own bilingual website, booking system, and phone line.
          </p>
        </Reveal>

        {notaries && (
          <Reveal delay={140}>
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
          </Reveal>
        )}

        <Reveal delay={200}>
          <p className="directory-more">
            <Link to="/notaries">
              See the full directory <Icon name="arrow" size={14} />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}

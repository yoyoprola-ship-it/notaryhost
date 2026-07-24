import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Icon from '../components/Icon'

export default function TenantMarketingPage({ slug }) {
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    getDoc(doc(db, 'publicNotaryProfiles', slug))
      .then((snap) => setProfile(snap.exists() ? snap.data() : null))
      .catch(() => setProfile(null))
  }, [slug])

  return (
    <div className="tenant-page">
      <header className="tenant-page__header">
        <span className="brand__mark">
          <Icon name="seal" size={18} />
        </span>
        <span>NotaryHost</span>
      </header>

      <main className="tenant-page__main">
        {profile === undefined && <p className="tenant-page__loading">Loading…</p>}

        {profile === null && (
          <div className="tenant-page__notfound">
            <h1>Not found</h1>
            <p>There's no notary set up at this address yet.</p>
          </div>
        )}

        {profile && (
          <div className="tenant-page__card">
            <h1>{profile.businessName}</h1>
            {profile.description && <p className="tenant-page__description">{profile.description}</p>}

            <div className="tenant-page__contact">
              {profile.ownerPhone && (
                <a className="tenant-page__contact-item" href={`tel:${profile.ownerPhone}`}>
                  <Icon name="phone" size={18} />
                  {profile.ownerPhone}
                </a>
              )}
              {profile.ownerEmail && (
                <a className="tenant-page__contact-item" href={`mailto:${profile.ownerEmail}`}>
                  {profile.ownerEmail}
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="tenant-page__footer">
        <span>Powered by NotaryHost</span>
      </footer>
    </div>
  )
}

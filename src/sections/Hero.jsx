import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const services = [
  { icon: 'globe', label: 'Bilingual website' },
  { icon: 'calendar', label: '24/7 bookings' },
  { icon: 'phone', label: 'Phone robot (IVR)' },
  { icon: 'gauge', label: 'Admin dashboard' },
  { icon: 'bolt', label: 'Urgent service' },
  { icon: 'truck', label: 'Mobile dispatch' },
]

export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="hero__glow" />
      <div className="hero__blob hero__blob--1" />
      <div className="hero__blob hero__blob--2" />
      <div className="section-inner hero__inner">
        <Reveal>
          <p className="eyebrow">Digital Solutions for Notaries</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="hero__title">
            A notary practice
            <br />
            worthy of trust
            <br />
            <em>at first sight.</em>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="hero__subtitle">
            I build bilingual booking, phone answering, and client
            management systems made specifically for mobile notaries, loan
            signing agents, and notary practices — so every client's first
            impression is flawless, day or night.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <ul className="hero__services">
            {services.map((s) => (
              <li key={s.label} className="hero__service-chip">
                <span className="hero__service-icon">
                  <Icon name={s.icon} size={14} />
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={320}>
          <div className="hero__tagline">
            <span className="brand__mark brand__mark--sm">
              <Icon name="seal" size={16} />
            </span>
            <em>Design · Build · Elevate</em>
          </div>
        </Reveal>
      </div>
    </header>
  )
}

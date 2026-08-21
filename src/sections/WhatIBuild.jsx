import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const items = [
  {
    icon: 'globe',
    title: 'Bilingual website',
    text: 'A polished, professional presentation of your notary practice in English and Spanish — fast and mobile-ready.',
  },
  {
    icon: 'calendar',
    title: '24/7 signing bookings',
    text: 'Clients book loan signings, closings, and notarizations online, any hour, with real-time availability.',
  },
  {
    icon: 'phone',
    title: 'Phone robot (IVR)',
    text: 'Answers calls about signings in English and Spanish — no missed clients, no answering-service fees.',
  },
  {
    icon: 'gauge',
    title: 'Admin dashboard',
    text: 'See every appointment, signing, and client message from any device.',
  },
  {
    icon: 'bolt',
    title: 'Urgent service',
    text: 'A one-tap button on your site and a first option on your phone line — texts you the moment a client needs you right now, no call required.',
  },
]

export default function WhatIBuild() {
  return (
    <section className="section" id="services">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">What do I build?</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            I design, build, and launch a complete digital practice for
            notaries — everything you need to book signings, answer calls,
            and look like the most trustworthy notary in town from the very
            first click.
          </p>
        </Reveal>
        <div className="grid grid--3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 90}>
              <div className="card">
                <span className="icon-badge">
                  <Icon name={item.icon} />
                </span>
                <h3 className="card__title">{item.title}</h3>
                <p className="card__text">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

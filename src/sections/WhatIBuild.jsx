import Icon from '../components/Icon'

const items = [
  {
    icon: 'globe',
    title: 'Bilingual website',
    text: 'A professional presentation in English and Spanish, fast and mobile-friendly.',
  },
  {
    icon: 'calendar',
    title: '24/7 booking system',
    text: 'Your clients book online, with real-time availability.',
  },
  {
    icon: 'phone',
    title: 'Phone robot (IVR)',
    text: 'Answers calls in English and Spanish, with no manual intervention.',
  },
  {
    icon: 'gauge',
    title: 'Admin dashboard',
    text: 'See appointments, messages, and stats from any device.',
  },
]

export default function WhatIBuild() {
  return (
    <section className="section">
      <div className="section-inner">
        <h2 className="section__title">What do I build?</h2>
        <p className="section__lead">
          I design, build, and launch complete custom web platforms with
          everything a business needs to attract clients, get organized
          internally, and project a professional image from day one.
        </p>
        <div className="grid grid--2">
          {items.map((item) => (
            <div className="card" key={item.title}>
              <span className="icon-badge">
                <Icon name={item.icon} />
              </span>
              <h3 className="card__title">{item.title}</h3>
              <p className="card__text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

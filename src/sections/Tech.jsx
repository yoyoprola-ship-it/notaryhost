import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const items = [
  {
    icon: 'server',
    title: 'No server to manage',
    text: 'No expensive hosting to pay for, no technical maintenance to worry about.',
  },
  {
    icon: 'cloud',
    title: 'Always available',
    text: 'Your website and booking system run 24 hours a day, 7 days a week.',
  },
  {
    icon: 'expand',
    title: 'Scalable',
    text: 'As your practice grows, the platform grows with it — nothing to rebuild.',
  },
  {
    icon: 'lock',
    title: 'Secure',
    text: 'Authentication, encryption, and role-based access from day one.',
  },
]

export default function Tech() {
  return (
    <section className="section section--dark">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">
            Technology that works while you rest
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            Everything runs on Google Cloud infrastructure — the same caliber
            of systems the banks and title companies you work with already
            trust.
          </p>
        </Reveal>
        <div className="grid grid--4">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 90}>
              <div className="card card--tint">
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

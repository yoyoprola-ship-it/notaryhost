import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const bullets = [
  'All your signings organized',
  'Cancellation management',
  'Availability & travel radius configuration',
  'Voice messages from clients',
]

const stats = [
  { title: 'Signings', text: 'booked this month' },
  { title: 'Calls', text: 'received by the robot' },
  { title: 'Messages', text: 'voicemails left by clients' },
]

export default function Dashboard() {
  return (
    <section className="section">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">
            Your whole practice, in one dashboard
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            A private dashboard, accessible from any device.
          </p>
        </Reveal>
        <div className="dashboard-grid">
          <Reveal>
            <ul className="check-list">
              {bullets.map((b) => (
                <li key={b}>
                  <span className="check-list__icon">
                    <Icon name="check" size={16} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="stats-card">
              <div className="stats-card__head">
                <span className="icon-badge">
                  <Icon name="chart" />
                </span>
                <h3>Practice statistics</h3>
              </div>
              {stats.map((s) => (
                <div className="stats-card__row" key={s.title}>
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </div>
              ))}
              <p className="stats-card__note">
                Clear, visual information so you know how your practice is
                growing.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

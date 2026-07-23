import Icon from '../components/Icon'

const bullets = [
  'All your appointments organized',
  'Cancellation management',
  'Working-hours configuration',
  'Voice messages from clients',
]

const stats = [
  { title: 'Appointments', text: 'booked this month' },
  { title: 'Calls', text: 'received by the robot' },
  { title: 'Messages', text: 'voicemails left by clients' },
]

export default function Dashboard() {
  return (
    <section className="section">
      <div className="section-inner">
        <h2 className="section__title">Your whole business, in one dashboard</h2>
        <p className="section__lead">
          A private dashboard, accessible from any device.
        </p>
        <div className="dashboard-grid">
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
          <div className="stats-card">
            <div className="stats-card__head">
              <span className="icon-badge">
                <Icon name="chart" />
              </span>
              <h3>Business statistics</h3>
            </div>
            {stats.map((s) => (
              <div className="stats-card__row" key={s.title}>
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </div>
            ))}
            <p className="stats-card__note">
              Clear, visual information so you know how your business is
              growing.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

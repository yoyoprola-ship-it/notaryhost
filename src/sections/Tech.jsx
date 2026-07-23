import Icon from '../components/Icon'

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
    text: 'As your business grows, the platform grows with it — nothing to rebuild.',
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
        <h2 className="section__title">
          Technology that works while you rest
        </h2>
        <p className="section__lead">Everything runs on Google Cloud infrastructure.</p>
        <div className="grid grid--4">
          {items.map((item) => (
            <div className="card card--tint" key={item.title}>
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

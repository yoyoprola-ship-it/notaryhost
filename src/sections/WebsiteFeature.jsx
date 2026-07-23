import Icon from '../components/Icon'

const bullets = [
  'Services and business description',
  'Location with an interactive map',
  'Business hours',
  'Direct contact options',
]

export default function WebsiteFeature() {
  return (
    <section className="split">
      <div className="split__panel split__panel--dark">
        <span className="icon-badge icon-badge--lg">
          <Icon name="globe" size={30} />
        </span>
        <h3 className="split__title">
          Professional
          <br />
          bilingual website
        </h3>
        <p className="split__text">
          English and Spanish, clean design, fast and mobile-friendly.
        </p>
      </div>
      <div className="split__panel split__panel--light">
        <h3 className="split__heading">
          Everything your clients need, in one place
        </h3>
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
        <div className="callout">
          <span className="icon-badge">
            <Icon name="calendar" />
          </span>
          <div>
            <h4>Online booking system</h4>
            <p>
              Your clients book 24/7, with no calls or back-and-forth
              messages. You control your hours from the admin dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

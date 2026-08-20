import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const bullets = [
  'Notarization types & services offered',
  'Service area with an interactive map',
  'Availability and typical response time',
  'Urgent-service button — texts you instantly, confirms in under a minute',
]

export default function WebsiteFeature() {
  return (
    <section className="split" id="website">
      <div className="split__panel split__panel--dark">
        <Reveal>
          <span className="icon-badge icon-badge--lg">
            <Icon name="globe" size={30} />
          </span>
          <h3 className="split__title">
            A bilingual website
            <br />
            built for a working notary
          </h3>
          <p className="split__text">
            English and Spanish, clean design, fast and mobile-friendly.
            The look isn't a fixed template — it's adjusted to your request.
          </p>
        </Reveal>
      </div>
      <div className="split__panel split__panel--light">
        <Reveal>
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
        </Reveal>
        <Reveal delay={120}>
          <div className="callout">
            <span className="icon-badge">
              <Icon name="calendar" />
            </span>
            <div>
              <h4>Online booking for signings</h4>
              <p>
                Clients book loan signings and notarizations 24/7, with no
                calls or back-and-forth messages. You control your
                availability from the admin dashboard.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

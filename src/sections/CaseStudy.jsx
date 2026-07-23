import Icon from '../components/Icon'

const bullets = [
  { icon: 'calendar', text: 'Book appointments online' },
  { icon: 'shield', text: 'Receive confirmation and reminders by text' },
  { icon: 'phone', text: 'The bilingual robot answers every call' },
]

export default function CaseStudy() {
  return (
    <section className="section">
      <div className="section-inner section-inner--narrow">
        <div className="case-card">
          <div className="case-card__band">
            <h2 className="section__title section__title--light">Real example</h2>
          </div>
          <div className="case-card__body">
            <div className="case-card__head">
              <span className="icon-badge">
                <Icon name="pin" />
              </span>
              <div>
                <h3>Lafayette, Louisiana</h3>
                <p className="muted">
                  Full system in production for a local business.
                </p>
              </div>
            </div>
            <ul className="bullet-list">
              {bullets.map((b) => (
                <li key={b.text}>
                  <span className="icon-badge">
                    <Icon name={b.icon} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
            <p className="case-card__footnote">
              — all without the owner lifting a finger.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

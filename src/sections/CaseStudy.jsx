import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const bullets = [
  { icon: 'calendar', text: 'Book signings online' },
  { icon: 'shield', text: 'Receive confirmation and reminders by text' },
  { icon: 'phone', text: 'The bilingual robot answers every call' },
]

export default function CaseStudy() {
  return (
    <section className="section">
      <div className="section-inner section-inner--narrow">
        <Reveal>
          <div className="case-card">
            <div className="case-card__band">
              <p className="eyebrow eyebrow--light">Real notary, real results</p>
              <h2 className="section__title section__title--light">
                In production
              </h2>
            </div>
            <div className="case-card__body">
              <div className="case-card__head">
                <span className="icon-badge">
                  <Icon name="pin" />
                </span>
                <div>
                  <h3>Lafayette, Louisiana</h3>
                  <p className="muted">
                    Full system in production for a mobile notary practice.
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
                — all without the notary lifting a finger.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const items = [
  { icon: 'file', title: 'Loan signing agents' },
  { icon: 'home', title: 'Real estate closings' },
  { icon: 'truck', title: 'Mobile & traveling notaries' },
  { icon: 'globe', title: 'Remote online notarization (RON)' },
  { icon: 'scale', title: 'General notarizations — POAs, affidavits, wills' },
  { icon: 'lock', title: 'Apostille & document authentication' },
]

export default function WhoFor() {
  return (
    <section className="section" id="who-for">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">Built for every kind of notary work</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            Whatever your specialty, your clients get the same polished
            booking, confirmation, and answering experience.
          </p>
        </Reveal>
        <div className="grid grid--3">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="card card--row">
                <span className="icon-badge">
                  <Icon name={item.icon} />
                </span>
                <h3 className="card__title card__title--inline">{item.title}</h3>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <div className="banner">
            + Any notarial act your clients need, handled with the same
            polish
          </div>
        </Reveal>
      </div>
    </section>
  )
}

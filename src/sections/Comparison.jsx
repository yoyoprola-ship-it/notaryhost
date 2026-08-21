import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const rows = [
  {
    icon: 'globe',
    title: 'Monthly website',
    range: '$99 – $179',
    text: 'Website only: hosting and maintenance.',
  },
  {
    icon: 'calendar',
    title: 'Booking system',
    range: '$13 – $28',
    text: 'Booking software, purchased separately.',
  },
  {
    icon: 'phone',
    title: 'AI receptionist / IVR',
    range: '$25 – $199',
    text: 'Automated phone answering, purchased separately.',
  },
  {
    icon: 'bolt',
    title: 'Urgent service',
    range: 'New concept',
    text: "We looked — nobody else sells this. A website button plus an IVR option that text the notary the moment a client needs them right now, with a live reply window. No market price exists to compare it to.",
    noRate: true,
  },
  {
    icon: 'truck',
    title: 'Mobile dispatch',
    range: 'New concept',
    text: 'Same story — no site we found combines address autocomplete, an automatic distance fee, and client-facing payment into one on-site dispatch flow. Nothing to compare it to either.',
    noRate: true,
  },
]

export default function Comparison() {
  return (
    <section className="section" id="comparison">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">How you compare to the market</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            U.S. market prices for similar services, purchased separately
            (2026).
          </p>
        </Reveal>
        <div className="grid grid--3">
          {rows.map((row, i) => (
            <Reveal key={row.title} delay={i * 90}>
              <div className="card">
                <span className="icon-badge">
                  <Icon name={row.icon} />
                </span>
                <h3 className="card__title">{row.title}</h3>
                <p className="price price--sm">
                  {row.range}
                  {!row.noRate && <span>/ mo</span>}
                </p>
                <p className="card__text">{row.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={280}>
          <div className="callout callout--full">
            Hiring each service separately:{' '}
            <strong>$137 – $406 / mo</strong>
          </div>
          <p className="section__note" style={{ textAlign: 'center', margin: '10px auto 0' }}>
            Doesn&rsquo;t include urgent service or mobile dispatch — there&rsquo;s no market rate to
            add for either, since nobody else offers them.
          </p>
        </Reveal>
        <Reveal delay={340}>
          <div className="bundle">
            <p className="eyebrow eyebrow--light">Your investment with us</p>
            <p className="price price--lg">
              $111<span>/ mo</span>
            </p>
            <p className="bundle__text">
              Website + booking + SMS verification + bilingual IVR + urgent
              service + admin dashboard — all in one place.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

import Icon from '../components/Icon'

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
]

export default function Comparison() {
  return (
    <section className="section">
      <div className="section-inner">
        <h2 className="section__title">How you compare to the market</h2>
        <p className="section__lead">
          U.S. market prices for similar services, purchased separately
          (2026).
        </p>
        <div className="grid grid--3">
          {rows.map((row) => (
            <div className="card" key={row.title}>
              <span className="icon-badge">
                <Icon name={row.icon} />
              </span>
              <h3 className="card__title">{row.title}</h3>
              <p className="price price--sm">
                {row.range}
                <span>/ mo</span>
              </p>
              <p className="card__text">{row.text}</p>
            </div>
          ))}
        </div>
        <div className="callout callout--full">
          Hiring each service separately:{' '}
          <strong>$137 – $406 / mo</strong>
        </div>
        <div className="bundle">
          <p className="eyebrow eyebrow--light">Your investment with us</p>
          <p className="price price--lg">
            $99<span>/ mo</span>
          </p>
          <p className="bundle__text">
            Website + booking + SMS verification + bilingual IVR + admin
            dashboard — all in one place.
          </p>
        </div>
      </div>
    </section>
  )
}

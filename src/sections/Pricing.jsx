import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const plans = [
  {
    icon: 'globe',
    title: 'Website + dashboard',
    price: '$64',
    text: 'Includes subdomain, hosting, and admin dashboard.',
    note: 'Unlimited visits.',
  },
  {
    icon: 'calendar',
    title: 'Booking system',
    price: '$19',
    text: 'Includes up to 40 signings booked per month.',
    note: 'Additional: $0.52 per booking.',
  },
  {
    icon: 'phone',
    title: 'Phone robot (IVR)',
    price: '$25',
    text: 'Includes up to 50 minutes per month.',
    note: 'Additional: $0.59 per minute.',
  },
]

export default function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">Investment</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            Each service works on its own — or bundle all three for a
            discount.
          </p>
        </Reveal>
        <div className="grid grid--3">
          {plans.map((plan, i) => (
            <Reveal key={plan.title} delay={i * 90}>
              <div className="card">
                <span className="icon-badge">
                  <Icon name={plan.icon} />
                </span>
                <h3 className="card__title">{plan.title}</h3>
                <p className="price">
                  {plan.price}
                  <span>/ mo</span>
                </p>
                <p className="card__text">{plan.text}</p>
                <p className="card__note">{plan.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={280}>
          <div className="bundle">
            <p className="eyebrow eyebrow--light">Complete package</p>
            <p className="price price--lg">
              $99<span>/ mo</span>
            </p>
            <p className="bundle__save">
              Separately: $108/mo → you save $9/mo
            </p>
            <p className="bundle__text">
              Website + admin dashboard + booking system + phone robot (IVR)
              — all together, at a bundled discount.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

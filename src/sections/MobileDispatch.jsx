import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const steps = [
  {
    icon: 'pin',
    title: 'Client enters their address',
    text: 'Address autocomplete keeps it fast and typo-free — no back-and-forth confirming a location by phone.',
  },
  {
    icon: 'dollar',
    title: 'Distance fee calculated and paid',
    text: 'The travel fee is calculated automatically from the distance, and charged before you leave — so a cancellation never costs you time or gas.',
  },
  {
    icon: 'truck',
    title: 'You head to the client',
    text: 'Everything is already confirmed and paid the moment you get in the car.',
  },
]

export default function MobileDispatch() {
  return (
    <section className="section" id="mobile-dispatch">
      <div className="section-inner">
        <Reveal>
          <p className="eyebrow">Mobile notaries only</p>
          <h2 className="section__title">Urgent notarization, at their door</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            When a client needs you on-site right now, this handles the
            logistics automatically — the fee, the payment, and the address —
            before you ever start the car.
          </p>
        </Reveal>
        <div className="steps">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 100}>
              <div className="step">
                <span className="step__number">{i + 1}</span>
                <span className="icon-badge">
                  <Icon name={step.icon} />
                </span>
                <h3 className="step__title">{step.title}</h3>
                <p className="step__text">{step.text}</p>
                {i < steps.length - 1 && (
                  <span className="step__arrow">
                    <Icon name="arrow" size={18} />
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={steps.length * 100}>
          <p className="section__note">
            Available as an add-on for notaries who travel to clients. Service
            area, minimum fee, and per-mile rate are all set to your request.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

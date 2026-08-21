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
    title: 'Distance fee calculated automatically',
    text: 'The travel fee is calculated the moment they enter their address. You decide when it gets charged — before you leave, or after the visit — it defaults however you set it up.',
  },
  {
    icon: 'truck',
    title: 'You head to the client',
    text: "Address and fee are already confirmed — payment follows whichever timing you chose.",
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
            logistics automatically — the address and the travel fee. Whether
            the client pays before you leave or after the visit is entirely
            your call.
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
            area, minimum fee, per-mile rate, and whether payment is
            collected before or after the visit are all set to your request —
            it's entirely your decision, not a fixed rule.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

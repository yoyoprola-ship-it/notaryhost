import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const steps = [
  {
    icon: 'seal',
    title: 'Share your personal link',
    text: 'Every notary gets their own permanent referral link — it never changes. Send it however you like: text, email, in person.',
  },
  {
    icon: 'check',
    title: 'Their site goes live and they pay',
    text: "Once their site is confirmed online and their first bill is paid, the referral counts — that's the day their subscription really starts.",
  },
  {
    icon: 'dollar',
    title: 'You get a free month',
    text: 'Applied automatically to your next bill. No limit on how many notaries you refer, and no cap on how many free months you can earn.',
  },
]

export default function Referrals() {
  return (
    <section className="section section--dark" id="referrals">
      <div className="section-inner">
        <Reveal>
          <p className="eyebrow">Referral program</p>
          <h2 className="section__title">Bring another notary, get a month free</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            Notaries already know other notaries. Every one you bring in who
            goes live and starts paying earns you a free month — no limit,
            no fine print.
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
      </div>
    </section>
  )
}

import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const steps = [
  {
    icon: 'globe',
    title: 'Chooses their language',
    text: 'Spanish or English, based on their preference.',
  },
  {
    icon: 'calendar',
    title: 'Books a signing',
    text: 'Hears the booking web address and gets a text with the direct link.',
  },
  {
    icon: 'mic',
    title: 'Leaves a voice inquiry',
    text: 'For urgent notarization requests — saved directly to your dashboard.',
  },
  {
    icon: 'transfer',
    title: 'Gets transferred',
    text: 'Directly to you, or whoever is in charge of taking calls.',
  },
]

export default function IVR() {
  return (
    <section className="section section--dark">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">
            A phone line worthy of your reputation
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            A bilingual automated system that answers your calls in English
            and Spanish — every time, no exceptions.
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

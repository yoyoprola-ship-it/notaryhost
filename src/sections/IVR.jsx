import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const steps = [
  {
    icon: 'globe',
    title: 'Chooses their language',
    text: 'Spanish or English, based on their preference.',
  },
  {
    icon: 'check',
    title: 'Hears their appointment status',
    text: 'If the caller already has a booking, the system checks their number and reads back the date and time — right in the language they just chose.',
  },
  {
    icon: 'bolt',
    title: 'Requests urgent service',
    text: "Texts you the caller's number right away. If you reply YES, they get a text back with your confirmation and address — no call needed on your end.",
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

const urgentAdvantages = [
  {
    icon: 'bolt',
    title: 'No phone calls',
    text: 'A text instead of a ring — check it on your own time, even mid-appointment.',
  },
  {
    icon: 'shield',
    title: 'No interruptions',
    text: "You're never pulled away from a client just to say you can't talk right now.",
  },
  {
    icon: 'gauge',
    title: 'Faster response',
    text: 'One word — YES — is all it takes to confirm you can help.',
  },
  {
    icon: 'check',
    title: 'Never miss urgent business',
    text: "Even when you can't talk, you can still say yes and keep the client.",
  },
]

export default function IVR() {
  return (
    <section className="section section--dark" id="how-it-works">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">
            A phone line worthy of your reputation
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            A bilingual automated system that answers your calls in English
            and Spanish — every time, no exceptions. It even recognizes
            returning callers and reads back their appointment details
            as soon as they pick a language.
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
                {i < steps.length - 1 && (i + 1) % 3 !== 0 && (
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
            This is the flow most notaries start with — the menu, voice
            prompts, and options are written and adjusted to your request,
            not a fixed script.
          </p>
        </Reveal>

        <Reveal delay={steps.length * 100 + 80}>
          <h3 className="section__subtitle">Why urgent service beats a phone call</h3>
        </Reveal>
        <div className="grid grid--4">
          {urgentAdvantages.map((a, i) => (
            <Reveal key={a.title} delay={steps.length * 100 + 160 + i * 90}>
              <div className="card card--tint">
                <span className="icon-badge">
                  <Icon name={a.icon} />
                </span>
                <h4 className="card__title">{a.title}</h4>
                <p className="card__text">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

import Icon from '../components/Icon'

const steps = [
  {
    icon: 'globe',
    title: 'Chooses their language',
    text: 'Spanish or English, based on their preference.',
  },
  {
    icon: 'calendar',
    title: 'Books an appointment',
    text: 'Hears the booking web address and gets a text with the direct link.',
  },
  {
    icon: 'mic',
    title: 'Leaves a voice inquiry',
    text: 'Saved directly to the website — you can reply by call or text.',
  },
  {
    icon: 'transfer',
    title: 'Gets transferred',
    text: 'Directly to whoever is in charge of taking calls.',
  },
]

export default function IVR() {
  return (
    <section className="section section--dark">
      <div className="section-inner">
        <h2 className="section__title">Bilingual phone robot (IVR)</h2>
        <p className="section__lead">
          An automated system that answers your business calls in English and
          Spanish.
        </p>
        <div className="steps">
          {steps.map((step, i) => (
            <div className="step" key={step.title}>
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
          ))}
        </div>
      </div>
    </section>
  )
}

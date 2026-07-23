import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const left = [
  'Professional website',
  '24/7 signing bookings',
  'Automatic reminders',
  'Admin dashboard',
  'Cloud infrastructure',
]

const right = [
  'Bilingual (English / Spanish)',
  'SMS verification',
  'Phone robot (IVR)',
  'Practice statistics',
  'Support and maintenance',
]

export default function Included() {
  return (
    <section className="section section--dark">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">What you get</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">Everything included, from day one.</p>
        </Reveal>
        <div className="grid grid--2 grid--gap-lg">
          <Reveal>
            <ul className="check-list check-list--dark">
              {left.map((item) => (
                <li key={item}>
                  <span className="check-list__icon check-list__icon--filled">
                    <Icon name="check" size={16} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100}>
            <ul className="check-list check-list--dark">
              {right.map((item) => (
                <li key={item}>
                  <span className="check-list__icon check-list__icon--filled">
                    <Icon name="check" size={16} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

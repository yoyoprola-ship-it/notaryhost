import Icon from '../components/Icon'

const left = [
  'Professional website',
  '24/7 booking system',
  'Automatic reminders',
  'Admin dashboard',
  'Cloud infrastructure',
]

const right = [
  'Bilingual (English / Spanish)',
  'SMS verification',
  'Phone robot (IVR)',
  'Business statistics',
  'Support and maintenance',
]

export default function Included() {
  return (
    <section className="section section--dark">
      <div className="section-inner">
        <h2 className="section__title">What you get</h2>
        <p className="section__lead">Everything included, from day one.</p>
        <div className="grid grid--2 grid--gap-lg">
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
        </div>
      </div>
    </section>
  )
}

import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

export default function Confirmations() {
  return (
    <section className="section" id="confirmations">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">Confirmations that never fail</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            Fewer fake bookings, fewer no-shows for signings you planned your
            whole day around.
          </p>
        </Reveal>
        <div className="grid grid--2">
          <Reveal>
            <div className="card card--dark">
              <span className="icon-badge">
                <Icon name="shield" />
              </span>
              <h3 className="card__title">SMS identity verification</h3>
              <p className="card__text">
                Before a signing is confirmed, the system sends a code to the
                client's phone. The booking is only recorded once they enter
                it correctly.
              </p>
              <p className="card__note">
                Eliminates fake bookings and guarantees the client's correct
                number.
              </p>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="card">
              <span className="icon-badge">
                <Icon name="bell" />
              </span>
              <h3 className="card__title">Automatic reminders</h3>
              <p className="card__text">
                Before the loan signing or closing, the client gets a text
                message reminding them of their appointment. No effort on
                your part, no extra staff.
              </p>
              <p className="card__note">
                Reduces last-minute cancellations and no-shows.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

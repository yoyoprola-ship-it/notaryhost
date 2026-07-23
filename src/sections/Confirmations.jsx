import Icon from '../components/Icon'

export default function Confirmations() {
  return (
    <section className="section">
      <div className="section-inner">
        <h2 className="section__title">Confirmations that don't fail</h2>
        <p className="section__lead">
          Fewer fake bookings, fewer no-shows, more trust.
        </p>
        <div className="grid grid--2">
          <div className="card card--dark">
            <span className="icon-badge">
              <Icon name="shield" />
            </span>
            <h3 className="card__title">SMS identity verification</h3>
            <p className="card__text">
              Before a booking is confirmed, the system sends a code to the
              client's phone. The reservation is only recorded once they
              enter it correctly.
            </p>
            <p className="card__note">
              Eliminates fake bookings and guarantees the client's correct
              number.
            </p>
          </div>
          <div className="card">
            <span className="icon-badge">
              <Icon name="bell" />
            </span>
            <h3 className="card__title">Automatic reminders</h3>
            <p className="card__text">
              On the day of the appointment, the client gets a text message
              reminding them of their booking. No effort on your part, no
              extra staff.
            </p>
            <p className="card__note">
              Reduces last-minute cancellations and no-shows.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

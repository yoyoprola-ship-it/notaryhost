import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const benefits = [
  {
    icon: 'globe',
    title: 'More presence online',
    text: 'A real website with your own name and subdomain — so when someone searches for a notary, you show up, not just a listing buried in a directory.',
  },
  {
    icon: 'pulse',
    title: 'More clients from exposure',
    text: 'Bilingual by default. Your site reaches English and Spanish speakers alike, so you\'re not leaving half the market on the table.',
  },
  {
    icon: 'phone',
    title: 'Never miss an opportunity',
    text: 'Your phone robot answers every call, 24/7 — even while you\'re with a client. A missed call is a lead going to whoever picks up next.',
  },
  {
    icon: 'shield',
    title: 'Instant credibility',
    text: 'A polished, professional site makes you look established. Clients trust who they can find, read about, and book online.',
  },
  {
    icon: 'gauge',
    title: 'Less time on the phone',
    text: 'Clients book themselves, day or night. No more back-and-forth calls just to find a time that works.',
  },
  {
    icon: 'bell',
    title: 'Fewer no-shows',
    text: 'Automatic SMS confirmations and same-day reminders keep appointments on people\'s minds — and on your calendar.',
  },
  {
    icon: 'chart',
    title: 'See your growth',
    text: 'Your dashboard tracks site visits, bookings, and calls — so you can see your marketing working, not just hope it is.',
  },
  {
    icon: 'dollar',
    title: 'One predictable bill',
    text: 'Website, booking system, and phone answering, billed together — instead of stitching together and paying for separate tools.',
  },
]

export default function Benefits() {
  return (
    <section className="section">
      <div className="section-inner">
        <Reveal>
          <h2 className="section__title">What this means for your business</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="section__lead">
            This isn&rsquo;t just a website — it&rsquo;s built to bring you more clients and
            save you time doing it.
          </p>
        </Reveal>
        <div className="grid grid--4">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 70}>
              <div className="card">
                <span className="icon-badge">
                  <Icon name={b.icon} />
                </span>
                <h3 className="card__title">{b.title}</h3>
                <p className="card__text">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

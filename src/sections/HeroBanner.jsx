import Reveal from '../components/Reveal'

export default function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="section-inner">
        <Reveal>
          <img
            className="hero-banner__img"
            src="/notaryhost-banner.jpg"
            alt="NotaryHost branded notary desk — a laptop showing the NotaryHost notary profile screen, a notary seal stamp and journal, and a business card, with icons for appointment scheduling, automatic confirmations, phone robot (IVR), business dashboard, and secure hosting."
            width="1536"
            height="1024"
            loading="lazy"
          />
        </Reveal>
      </div>
    </section>
  )
}

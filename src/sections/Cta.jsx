import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

export default function Cta() {
  return (
    <section className="cta" id="contact">
      <div className="cta__glow" />
      <div className="cta__blob" />
      <div className="section-inner cta__inner">
        <Reveal>
          <span className="brand__mark brand__mark--lg">
            <Icon name="seal" size={28} />
          </span>
          <h2 className="cta__title">
            Want your notary practice to run like this?
          </h2>
          <p className="cta__subtitle">Let's talk.</p>
          <a className="btn btn--primary" href="mailto:yoyoprola@gmail.com">
            Get in touch
          </a>
        </Reveal>
      </div>
    </section>
  )
}

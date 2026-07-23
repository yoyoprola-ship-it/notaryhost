import Icon from '../components/Icon'

export default function Cta() {
  return (
    <section className="cta" id="contact">
      <div className="cta__blob" />
      <div className="section-inner cta__inner">
        <span className="brand__mark brand__mark--lg">
          <Icon name="rocket" size={28} />
        </span>
        <h2 className="cta__title">Want your business to work like this?</h2>
        <p className="cta__subtitle">Let's talk.</p>
        <a className="btn btn--primary" href="mailto:yoyoprola@gmail.com">
          Get in touch
        </a>
      </div>
    </section>
  )
}

import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero__glow" />
      <div className="hero__blob hero__blob--1" />
      <div className="hero__blob hero__blob--2" />
      <div className="section-inner hero__inner">
        <nav className="hero__nav">
          <div className="brand">
            <span className="brand__mark">
              <Icon name="seal" size={18} />
            </span>
            <span>NotaryHost</span>
          </div>
          <a className="btn btn--ghost" href="#contact">
            Get in touch
          </a>
        </nav>

        <Reveal>
          <p className="eyebrow">Digital Solutions for Notaries</p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="hero__title">
            A notary practice
            <br />
            worthy of trust
            <br />
            <em>at first sight.</em>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="hero__subtitle">
            I build bilingual booking, phone answering, and client
            management systems made specifically for mobile notaries, loan
            signing agents, and notary practices — so every client's first
            impression is flawless, day or night.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="hero__tagline">
            <span className="brand__mark brand__mark--sm">
              <Icon name="seal" size={16} />
            </span>
            <em>Design · Build · Elevate</em>
          </div>
        </Reveal>
      </div>
    </header>
  )
}

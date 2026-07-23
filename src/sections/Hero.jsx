import Icon from '../components/Icon'

export default function Hero() {
  return (
    <header className="hero">
      <div className="hero__blob hero__blob--1" />
      <div className="hero__blob hero__blob--2" />
      <div className="section-inner hero__inner">
        <nav className="hero__nav">
          <div className="brand">
            <span className="brand__mark">
              <Icon name="rocket" size={18} />
            </span>
            <span>Digital Solutions</span>
          </div>
          <a className="btn btn--ghost" href="#contact">
            Get in touch
          </a>
        </nav>

        <p className="eyebrow">Digital Solutions</p>
        <h1 className="hero__title">
          Digital solutions
          <br />
          for your business
        </h1>
        <p className="hero__subtitle">
          I turn local businesses into modern, automated operations that are
          available around the clock — without you having to hire a tech
          team.
        </p>
        <div className="hero__tagline">
          <span className="brand__mark brand__mark--sm">
            <Icon name="rocket" size={16} />
          </span>
          <em>Design · Build · Launch</em>
        </div>
      </div>
    </header>
  )
}

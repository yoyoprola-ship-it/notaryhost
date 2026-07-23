import Icon from '../components/Icon'

const items = [
  { icon: 'scale', title: 'Lawyers and law firms' },
  { icon: 'home', title: 'Real estate agencies' },
  { icon: 'pulse', title: 'Clinics and medical offices' },
  { icon: 'truck', title: 'Dealerships and auto shops' },
  { icon: 'scissors', title: 'Beauty salons and spas' },
  { icon: 'dollar', title: 'Accountants and financial advisors' },
]

export default function WhoFor() {
  return (
    <section className="section">
      <div className="section-inner">
        <h2 className="section__title">Who is this for?</h2>
        <p className="section__lead">
          Any local business that wants to stop losing clients to a lack of
          digital presence or to manual processes that eat up time.
        </p>
        <div className="grid grid--3">
          {items.map((item) => (
            <div className="card card--row" key={item.title}>
              <span className="icon-badge">
                <Icon name={item.icon} />
              </span>
              <h3 className="card__title card__title--inline">{item.title}</h3>
            </div>
          ))}
        </div>
        <div className="banner">
          + Any business with appointments, calls, or recurring clients
        </div>
      </div>
    </section>
  )
}

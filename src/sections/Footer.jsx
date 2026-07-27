import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="section-inner footer__inner">
        <span>© {new Date().getFullYear()} Joe Software Usa LLC — NotaryHost</span>
        <div className="footer__links">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <a href="tel:+13375674067">(337) 567-4067</a>
          <a href="mailto:yoyoprola@gmail.com">yoyoprola@gmail.com</a>
        </div>
      </div>
    </footer>
  )
}

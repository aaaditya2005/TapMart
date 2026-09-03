import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <p className="footer-tagline">Tap. Order. Enjoy.</p>
          <p>&copy; 2026 TapMart. All rights reserved.</p>
        </div>
        <div className="footer-info">
          <section>
            <h2><Link to="/contact">Contact us</Link></h2>
            <p>Questions about an order, product, or delivery? Our support team is ready to help.</p>
          </section>
          <section>
            <h2><Link to="/privacy">Privacy policy</Link></h2>
            <p>Learn how we collect, use, and protect information while you shop with TapMart.</p>
          </section>
          <section>
            <h2><Link to="/terms">Terms and conditions</Link></h2>
            <p>Read the terms that apply when you use our website and place an order.</p>
          </section>
        </div>
      </div>
    </footer>
  )
}

export default Footer

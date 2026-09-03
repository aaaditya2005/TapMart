import './Contact.css'

const Contact = () => {
  return (
    <article className="contact-page">
      <p className="eyebrow">We are here to help</p>
      <h1>Contact Us</h1>
      <p className="policy-intro">Have a question about an order, product, delivery, or your account? The TapMart support team is happy to help.</p>
      <div className="policy-sections">
        <section>
          <h2>Customer support</h2>
          <p>Email us at <a href="mailto:support@tapmart.example">support@tapmart.example</a>. We aim to reply within two business days.</p>
        </section>
        <section>
          <h2>Order assistance</h2>
          <p>When contacting us about an order, include your order number and the email address used at checkout. This helps us find your details quickly.</p>
        </section>
        <section>
          <h2>Business hours</h2>
          <p>Our support team is available Monday through Friday, from 9:00 AM to 6:00 PM IST, excluding public holidays.</p>
        </section>
        <section>
          <h2>Feedback and suggestions</h2>
          <p>We value your feedback. Tell us what is working well and where we can make your TapMart experience simpler.</p>
        </section>
      </div>
    </article>
  )
}

export default Contact

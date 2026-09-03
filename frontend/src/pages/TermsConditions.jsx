import './TermsConditions.css'

const TermsConditions = () => {
  return (
    <article className="terms-page">
      <p className="eyebrow">Please read before ordering</p>
      <h1>Terms and Conditions</h1>
      <p className="policy-intro">These Terms and Conditions govern your use of TapMart and purchases made through our website. Last updated: August 27, 2026.</p>
      <div className="policy-sections">
        <section>
          <h2>Using TapMart</h2>
          <p>You agree to provide accurate information, keep your account credentials private, and use TapMart only for lawful purposes. You must be at least the legal age required to enter into a purchase agreement in your location.</p>
        </section>
        <section>
          <h2>Products and availability</h2>
          <p>We aim to keep product descriptions, prices, and stock information accurate. Products may become unavailable, and we may correct errors or cancel an order if an important listing or pricing mistake occurs.</p>
        </section>
        <section>
          <h2>Orders and payments</h2>
          <p>An order is accepted when TapMart confirms it. You are responsible for reviewing your cart and delivery details before placing an order. Payment must be completed through the methods shown at checkout.</p>
        </section>
        <section>
          <h2>Delivery and returns</h2>
          <p>Delivery estimates are provided for guidance and may change because of location, weather, carriers, or other events outside our control. Return or replacement requests must follow the applicable instructions provided with your order.</p>
        </section>
        <section>
          <h2>Accounts and content</h2>
          <p>You are responsible for activity under your account and for content you submit. We may suspend accounts involved in fraud, misuse, abuse, or activity that harms other customers or the service.</p>
        </section>
        <section>
          <h2>Changes and contact</h2>
          <p>We may update these terms as TapMart develops. Continued use after an update means you accept the revised terms. Questions can be sent to <a href="mailto:support@tapmart.example">support@tapmart.example</a>.</p>
        </section>
      </div>
    </article>
  )
}

export default TermsConditions

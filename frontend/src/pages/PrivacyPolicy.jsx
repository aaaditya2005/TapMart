import './PrivacyPolicy.css'

const PrivacyPolicy = () => {
  return (
    <article className="privacy-page">
      <p className="eyebrow">Your information matters</p>
      <h1>Privacy Policy</h1>
      <p className="policy-intro">This Privacy Policy explains how TapMart collects, uses, and protects information when you browse our website or place an order. Last updated: August 27, 2026.</p>
      <div className="policy-sections">
        <section>
          <h2>Information we collect</h2>
          <p>We may collect your name, email address, shipping address, phone number, order details, and account information when you create an account or purchase from us. We also receive basic device and website usage information needed to keep the service secure and reliable.</p>
        </section>
        <section>
          <h2>How we use your information</h2>
          <p>We use this information to process and deliver orders, provide customer support, verify accounts, send important service updates, prevent fraud, and improve our products and website. We do not sell your personal information.</p>
        </section>
        <section>
          <h2>Payments and third parties</h2>
          <p>Payments are handled by trusted payment providers. TapMart does not store complete card numbers or payment passwords. We may share the information necessary with delivery, payment, hosting, and communication partners to provide the service.</p>
        </section>
        <section>
          <h2>Cookies and security</h2>
          <p>We may use cookies or similar technologies to remember preferences, maintain sessions, and understand website performance. We use reasonable administrative and technical safeguards, but no internet service can guarantee absolute security.</p>
        </section>
        <section>
          <h2>Your choices</h2>
          <p>You may ask us to update or delete eligible account information by contacting support. You can also unsubscribe from optional marketing messages at any time. Transactional messages about your account or orders may still be sent.</p>
        </section>
        <section>
          <h2>Policy updates</h2>
          <p>We may update this policy when our practices or legal requirements change. The latest version will always be posted on this page.</p>
        </section>
      </div>
    </article>
  )
}

export default PrivacyPolicy

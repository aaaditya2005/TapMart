import './Home.css'

const Home = () => {
  return (
    <>
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">Tap. Order. Enjoy.</p>
          <h1>Find what you need, without the hassle.</h1>
          <p className="hero-copy">
            Discover useful products at honest prices, delivered right to your door.
          </p>
          <a className="primary-button" href="/products">Start shopping</a>
        </div>
      </section>

      <section className="benefits-section" aria-labelledby="benefits-title">
        <div className="section-heading">
          <p className="eyebrow">Why TapMart</p>
          <h2 id="benefits-title">Shopping that fits your day.</h2>
          <p>Everything you need for a smoother, more reliable online order.</p>
        </div>
        <div className="benefits-grid">
          <article className="benefit-item">
            <span className="benefit-number">01</span>
            <h3>Useful products</h3>
            <p>A focused collection of products chosen for everyday life.</p>
          </article>
          <article className="benefit-item">
            <span className="benefit-number">02</span>
            <h3>Clear prices</h3>
            <p>Know what you are paying with straightforward product details.</p>
          </article>
          <article className="benefit-item">
            <span className="benefit-number">03</span>
            <h3>Easy delivery</h3>
            <p>Place your order in a few taps and follow it from checkout to door.</p>
          </article>
        </div>
      </section>

    </>
  )
}
export default Home

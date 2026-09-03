import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatCurrency } from '../utils/currency'
import './Cart.css'

function Cart() {
  const { cartItems, itemCount, subtotal, updateQuantity, removeFromCart, clearCart } = useCart()

  if (cartItems.length === 0) {
    return (
      <main className="cart-page cart-empty">
        <p className="eyebrow">Your cart</p>
        <h1>Your cart is empty</h1>
        <p>Browse our products and add something you like.</p>
        <Link className="cart-button" to="/products">Browse products</Link>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <div className="cart-heading">
        <div>
          <p className="eyebrow">Your cart</p>
          <h1>Shopping cart</h1>
        </div>
        <button className="clear-cart" type="button" onClick={clearCart}>Clear cart</button>
      </div>
      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {cartItems.map((item) => (
            <article className="cart-item" key={item._id}>
              <img src={item.imageURL} alt={item.name} />
              <div className="cart-item-info">
                <h2><Link className="cart-product-link" to={`/products/${item._id}`}>{item.name}</Link></h2>
                <p>{formatCurrency(item.price)} each</p>
                <div className="quantity-controls">
                  <button type="button" onClick={() => item.qty === 1 ? removeFromCart(item._id) : updateQuantity(item._id, item.qty - 1)} aria-label={`Decrease ${item.name} quantity`}>-</button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateQuantity(item._id, item.qty + 1)} disabled={item.qty >= item.stock} aria-label={`Increase ${item.name} quantity`}>+</button>
                </div>
              </div>
              <div className="cart-item-total">
                <strong>{formatCurrency(item.price * item.qty)}</strong>
                <button className="remove-item" type="button" onClick={() => removeFromCart(item._id)}>Remove</button>
              </div>
            </article>
          ))}
        </section>
        <aside className="cart-summary">
          <h2>Order summary</h2>
          <p><span>Items ({itemCount})</span><strong>{formatCurrency(subtotal)}</strong></p>
          <p><span>Delivery</span><strong>Calculated at checkout</strong></p>
          <div className="summary-total"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
          <Link className="cart-button" to="/checkout">Continue to checkout</Link>
        </aside>
      </div>
    </main>
  )
}

export default Cart

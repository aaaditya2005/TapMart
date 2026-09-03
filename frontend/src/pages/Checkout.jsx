import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cancelPendingPaymentOrder, createOrder, createPaymentOrder, verifyPayment } from '../services/api'
import { useCart } from '../hooks/useCart'
import { useStore } from '../context/StoreContext'
import { formatCurrency } from '../utils/currency'
import './Checkout.css'

const emptyAddress = {
  address: '',
  city: '',
  postalCode: '',
  country: 'India',
}

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true)
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.onload = () => resolve(true)
  script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'))
  document.body.appendChild(script)
})

function Checkout() {
  const navigate = useNavigate()
  const { cartItems, itemCount, subtotal, clearCart } = useCart()
  const { addOrderToStore, refreshAllData } = useStore()
  const [form, setForm] = useState(emptyAddress)
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    let order
    try {
      order = await createOrder({
        orderItems: cartItems.map((item) => ({ product: item._id || item.id, qty: item.qty })),
        shippingAddress: form,
        paymentMethod,
      })

      addOrderToStore(order)
      refreshAllData()

      if (paymentMethod === 'cash_on_delivery') {
        clearCart()
        navigate('/order-success', { state: { orderId: order._id || order.id, total: order.totalPrice, paymentStatus: order.paymentStatus, paymentMethod } })
        return
      }

      const paymentOrder = await createPaymentOrder(order._id)
      await loadRazorpay()
      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: 'TapMart',
          description: `Order #${order._id}`,
          order_id: paymentOrder.razorpayOrderId,
          handler: async (response) => {
            try {
              await verifyPayment({
                orderId: order._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              resolve()
            } catch (verificationError) {
              reject(verificationError)
            }
          },
          modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
        })
        razorpay.open()
      })
      clearCart()
      navigate('/order-success', { state: { orderId: order._id, total: order.totalPrice, paymentStatus: 'paid', paymentMethod } })
    } catch (requestError) {
      if (paymentMethod === 'razorpay' && order?._id) {
        try {
          await cancelPendingPaymentOrder(order._id)
        } catch (cancelError) {
          console.error(cancelError)
        }
      }
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page checkout-empty">
        <p className="eyebrow">Checkout</p>
        <h1>Your cart is empty</h1>
        <p>Add a product before starting checkout.</p>
        <Link className="checkout-button" to="/products">Browse products</Link>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <div className="checkout-heading">
        <p className="eyebrow">Checkout</p>
        <h1>Complete your order</h1>
      </div>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping address</h2>
          <label>Address<input name="address" value={form.address} onChange={updateField} required /></label>
          <label>City<input name="city" value={form.city} onChange={updateField} required /></label>
          <label>Postal code<input name="postalCode" inputMode="numeric" value={form.postalCode} onChange={updateField} required /></label>
          <label>Country<input name="country" value={form.country} onChange={updateField} required /></label>
          <fieldset>
            <legend>Payment method</legend>
            <label><input type="radio" name="paymentMethod" value="cash_on_delivery" checked={paymentMethod === 'cash_on_delivery'} onChange={(event) => setPaymentMethod(event.target.value)} /> Cash on delivery</label>
            <label><input type="radio" name="paymentMethod" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(event) => setPaymentMethod(event.target.value)} /> Razorpay</label>
          </fieldset>
          {error && <p className="checkout-error" role="alert">{error}</p>}
          <button className="checkout-button" type="submit" disabled={loading}>{loading ? 'Placing order...' : 'Place order'}</button>
        </form>
        <aside className="checkout-summary">
          <h2>Order summary</h2>
          <p><span>Items ({itemCount})</span><strong>{formatCurrency(subtotal)}</strong></p>
          <p><span>Delivery</span><strong>To be calculated</strong></p>
          <div><span>Total</span><strong>{formatCurrency(subtotal)}</strong></div>
        </aside>
      </div>
    </main>
  )
}

export default Checkout
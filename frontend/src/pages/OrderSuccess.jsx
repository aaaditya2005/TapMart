import { Link, useLocation } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import './Checkout.css'

function OrderSuccess() {
  const { state } = useLocation()

  return (
    <main className="checkout-page checkout-empty">
      <p className="eyebrow">Order confirmed</p>
      <h1>Thank you for your order.</h1>
      <p>Your order {state?.orderId ? `#${state.orderId}` : ''} has been placed{state?.total ? ` for ${formatCurrency(state.total)}` : ''}.</p>
      <p className={state?.paymentStatus === 'paid' ? 'payment-success' : 'payment-pending'}>
        {state?.paymentStatus === 'paid' ? 'Payment successful.' : 'Payment pending. You will pay when your order is delivered.'}
      </p>
      <Link className="checkout-button" to="/products">Continue shopping</Link>
    </main>
  )
}

export default OrderSuccess
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../services/api'
import { formatCurrency } from '../utils/currency'
import './Orders.css'

const statuses = ['confirmed', 'processing', 'shipped', 'delivered']

function OrderDetails() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <main className="orders-page"><p className="orders-message">Loading order...</p></main>
  if (error || !order) return <main className="orders-page"><p className="orders-message orders-error">{error || 'Order not found.'}</p></main>

  const currentStatus = statuses.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <main className="orders-page">
      <Link className="orders-back-link" to="/orders">Back to my orders</Link>
      <div className="order-detail-heading">
        <div>
          <p className="eyebrow">Order details</p>
          <h1>Order #{order._id.slice(-8)}</h1>
        </div>
        <div className="order-status-summary">
          <strong>{order.paymentStatus === 'paid' ? 'Payment paid' : 'Payment pending'}</strong>
          <span>{formatCurrency(order.totalPrice)}</span>
        </div>
      </div>
      <section className="order-timeline" aria-label="Order status timeline">
        {isCancelled ? <p className="cancelled-status">This order was cancelled.</p> : statuses.map((status, index) => (
          <div className={`timeline-step ${index <= currentStatus ? 'timeline-complete' : ''}`} key={status}>
            <span className="timeline-dot" />
            <div><strong>{status}</strong><p>{index <= currentStatus ? 'Completed' : 'Upcoming'}</p></div>
          </div>
        ))}
      </section>
      <section className="order-items-section">
        <h2>Items</h2>
        {order.orderItems.map((item) => {
          const productId = item.product?._id || item.product
          return <div className="order-item-row" key={item._id}><Link className="order-product-link" to={`/products/${productId}`}>{item.name} x {item.qty}</Link><strong>{formatCurrency(item.price * item.qty)}</strong></div>
        })}
      </section>
      <section className="order-address">
        <h2>Delivery address</h2>
        <p>{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
      </section>
      {order.receiptURL && <p className="order-receipt"><a href={order.receiptURL} target="_blank" rel="noreferrer">Download payment receipt</a></p>}
    </main>
  )
}

export default OrderDetails

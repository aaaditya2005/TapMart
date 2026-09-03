import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../utils/currency'
import { useStore } from '../context/StoreContext'
import './Orders.css'

function MyOrders() {
  const { myOrders, fetchMyOrders } = useStore()

  useEffect(() => {
    fetchMyOrders()
  }, [fetchMyOrders])

  return (
    <main className="orders-page">
      <p className="eyebrow">Your account</p>
      <h1>My orders</h1>

      {myOrders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #d1d5db', marginTop: '24px' }}>
          <p className="orders-message" style={{ marginBottom: '20px' }}>You have not placed any orders yet.</p>
          <Link to="/products" className="primary-button" style={{ display: 'inline-flex', padding: '10px 20px', textDecoration: 'none' }}>
            Start Shopping
          </Link>
        </div>
      )}

      {myOrders.length > 0 && (
        <section className="orders-list" aria-label="Your orders">
          {myOrders.map((order) => {
            const orderId = order._id || order.id || ''
            return (
              <Link className="order-row" to={`/orders/${orderId}`} key={orderId}>
                <div>
                  <strong>Order #{orderId.slice(-8)}</strong>
                  <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                  <span>{(order.orderItems || []).map((item) => item.name).join(', ')}</span>
                </div>
                <div>
                  <strong>{formatCurrency(order.totalPrice)}</strong>
                  <span>{order.status}</span>
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default MyOrders

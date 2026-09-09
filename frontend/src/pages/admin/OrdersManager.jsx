import { useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import { updateOrderStatus } from '../../services/api'

const nextStatuses = { pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped'], shipped: ['delivered'], delivered: [], cancelled: [] }

const OrdersManager = ({ orders, setOrders }) => {
  const [updatingId, setUpdatingId] = useState('')
  const changeStatus = async (orderId, status) => {
    setUpdatingId(orderId)
    try {
      const updated = await updateOrderStatus(orderId, { status })
      setOrders((current) => current.map((order) => (order._id || order.id) === orderId ? { ...order, ...updated } : order))
    } catch (requestError) { alert(requestError.message) } finally { setUpdatingId('') }
  }

  return <section className="admin-orders"><h2>Customer Orders ({orders.length})</h2>{orders.length === 0 ? <p className="admin-message">No orders placed yet.</p> : orders.map((order) => <article className="admin-order" key={order._id}><div><strong>#{order._id.slice(-8)}</strong><span>{order.user?.name || 'Customer'} · {new Date(order.createdAt).toLocaleDateString('en-IN')}</span><span>{order.orderItems.map((item) => `${item.name} x ${item.qty}`).join(', ')}</span></div><strong>{formatCurrency(order.totalPrice)}</strong><label>Status<select value={order.status} disabled={updatingId === order._id} onChange={(event) => changeStatus(order._id, event.target.value)}>{[order.status, ...(nextStatuses[order.status] || [])].map((status) => <option key={status}>{status}</option>)}</select></label><div className="admin-payment"><span>{order.paymentStatus}</span></div></article>)}</section>
}

export default OrdersManager
import { formatCurrency } from '../../utils/currency'

const AnalyticsOverview = ({ stats, productCount, outOfStockCount }) => (
  <section className="admin-stats-section">
    <h2>Analytics Overview</h2>
    <div className="admin-stats" aria-label="Dashboard statistics">
      <div><span>Total Orders</span><strong>{stats?.totalOrders || 0}</strong></div>
      <div><span>Registered Users</span><strong>{stats?.totalUsers || 0}</strong></div>
      <div><span>Total Products</span><strong>{productCount || stats?.totalProducts || 0}</strong></div>
      <div><span>Total Revenue (Delivered)</span><strong>{formatCurrency(stats?.totalRevenue || 0)}</strong></div>
    </div>
    {outOfStockCount > 0 && <div className="admin-alert error" style={{ marginTop: '20px' }}><strong>Attention needed:</strong> You have {outOfStockCount} product(s) out of stock! Go to the <strong>Manage Inventory</strong> tab to add quantity.</div>}
  </section>
)

export default AnalyticsOverview
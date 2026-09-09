import { useEffect, useState } from 'react'
import { getAdminStats, getAllOrders, getAdminProducts } from '../../services/api'
import { useStore } from '../../context/StoreContext'
import AdminTabs from './AdminTabs'
import AnalyticsOverview from './AnalyticsOverview'
import InventoryManager from './InventoryManager'
import AddProductForm from './AddProductForm'
import OrdersManager from './OrdersManager'
import './AdminDashboard.css'

function AdminDashboard() {
  const { adminStats, setAdminStats, adminOrders, setAdminOrders, products, setProducts, fetchAdminData } = useStore()
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('analytics')
  const orders = adminOrders || []

  const loadDashboard = async () => {
    try {
      const [statsData, ordersData, productsData] = await Promise.all([getAdminStats(), getAllOrders(), getAdminProducts()])
      setAdminStats(statsData)
      setAdminOrders(ordersData)
      setProducts(productsData)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  useEffect(() => {
    fetchAdminData().then((result) => {
      if (result) {
        setAdminStats(result.stats)
        setAdminOrders(result.orders)
      }
    })
  }, [fetchAdminData, setAdminStats, setAdminOrders])

  const outOfStockCount = products.filter((product) => product.stock === 0).length

  return (
    <main className="admin-dashboard">
      <header className="admin-heading">
        <div><p className="eyebrow">TapMart Admin</p><h1>Management Portal</h1></div>
        <button className="admin-refresh" type="button" onClick={loadDashboard}>Refresh Data</button>
      </header>

      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} productCount={products.length} orderCount={orders.length} outOfStockCount={outOfStockCount} />
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {!error && activeTab === 'analytics' && <AnalyticsOverview stats={adminStats} productCount={products.length} outOfStockCount={outOfStockCount} />}
      {!error && activeTab === 'manage-products' && <InventoryManager products={products} setProducts={setProducts} onReload={loadDashboard} />}
      {!error && activeTab === 'add-product' && <AddProductForm onReload={loadDashboard} />}
      {!error && activeTab === 'orders' && <OrdersManager orders={orders} setOrders={setAdminOrders} />}
    </main>
  )
}

export default AdminDashboard
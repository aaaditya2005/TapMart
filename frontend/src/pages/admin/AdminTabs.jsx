const AdminTabs = ({ activeTab, onTabChange, productCount, orderCount, outOfStockCount }) => {
  const tabs = [
    { id: 'analytics', label: 'Analytics & Overview' },
    { id: 'manage-products', label: `Manage Inventory (${productCount})` },
    { id: 'add-product', label: '+ Add New Product' },
    { id: 'orders', label: `Manage Orders (${orderCount})` },
  ]

  return (
    <nav className="admin-tabs" aria-label="Admin tabs">
      {tabs.map((tab) => (
        <button type="button" className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => onTabChange(tab.id)} key={tab.id}>
          {tab.label}
          {tab.id === 'manage-products' && outOfStockCount > 0 && <span className="tab-badge warning">{outOfStockCount} Out of Stock</span>}
        </button>
      ))}
    </nav>
  )
}

export default AdminTabs
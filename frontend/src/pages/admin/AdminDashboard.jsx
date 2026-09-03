import { useEffect, useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import { getAdminStats, getAllOrders, getProducts, updateOrderStatus, createProduct, updateProduct, deleteProduct } from '../../services/api'
import { useStore } from '../../context/StoreContext'
import './AdminDashboard.css'

const statuses = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const categories = ['Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home & Kitchen', 'Beauty', 'Sports', 'Other']

function AdminDashboard() {
  const { adminStats, setAdminStats, adminOrders, setAdminOrders, products, setProducts, fetchAdminData } = useStore()

  const stats = adminStats
  const orders = adminOrders || []
  const setStats = setAdminStats
  const setOrders = setAdminOrders
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics', 'manage-products', 'add-product', 'orders'

  // Manage Inventory State
  const [editingStock, setEditingStock] = useState({}) // { [productId]: newStockValue }
  const [updatingStockId, setUpdatingStockId] = useState('')
  const [productActionMessage, setProductActionMessage] = useState('')

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    stock: '',
    description: '',
    tags: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [submittingProduct, setSubmittingProduct] = useState(false)
  const [productSuccess, setProductSuccess] = useState('')
  const [productError, setProductError] = useState('')

  useEffect(() => {
    fetchAdminData().then((res) => {
      if (res) {
        setAdminStats(res.stats)
        setAdminOrders(res.orders)
        const stockMap = {}
        ;(res.products || []).forEach((p) => {
          stockMap[p._id || p.id] = p.stock
        })
        setEditingStock(stockMap)
      }
    })
  }, [])

  const loadDashboard = async () => {
    try {
      const [statsData, ordersData, productsData] = await Promise.all([
        getAdminStats(),
        getAllOrders(),
        getProducts()
      ])
      setStats(statsData)
      setOrders(ordersData)
      setProducts(productsData)
      setAdminStats(statsData)
      setAdminOrders(ordersData)

      const stockMap = {}
      productsData.forEach((p) => {
        stockMap[p._id || p.id] = p.stock
      })
      setEditingStock(stockMap)
    } catch (err) {
      setError(err.message)
    }
  }

  const changeStatus = async (orderId, status) => {
    setUpdatingId(orderId)
    try {
      const updated = await updateOrderStatus(orderId, { status })
      setOrders((current) => current.map((order) => (order._id || order.id) === orderId ? { ...order, ...updated } : order))
      setAdminOrders((current) => current.map((order) => (order._id || order.id) === orderId ? { ...order, ...updated } : order))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingId('')
    }
  }

  // Handle Stock Input Change
  const handleStockInputChange = (productId, value) => {
    setEditingStock((prev) => ({
      ...prev,
      [productId]: value
    }))
  }

  // Update Stock API Call
  const handleSaveStock = async (product, customStock = null) => {
    const newStock = customStock !== null ? customStock : Number(editingStock[product._id])
    if (isNaN(newStock) || newStock < 0) {
      alert('Please enter a valid non-negative stock number.')
      return
    }

    setUpdatingStockId(product._id)
    setProductActionMessage('')
    try {
      const updated = await updateProduct(product._id, { stock: newStock })
      setProducts((prev) => prev.map((p) => p._id === product._id ? { ...p, stock: updated.stock } : p))
      setEditingStock((prev) => ({ ...prev, [product._id]: updated.stock }))
      setProductActionMessage(`Stock for "${product.name}" updated to ${updated.stock} units!`)
      setTimeout(() => setProductActionMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Failed to update stock.')
    } finally {
      setUpdatingStockId('')
    }
  }

  // Quick Add Stock (e.g. +10, +50)
  const handleQuickAddStock = (product, addQty) => {
    const currentStock = product.stock || 0
    const targetStock = currentStock + addQty
    handleSaveStock(product, targetStock)
  }

  // Delete Product
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return

    setUpdatingStockId(product._id)
    try {
      await deleteProduct(product._id)
      setProducts((prev) => prev.filter((p) => p._id !== product._id))
      setProductActionMessage(`Product "${product.name}" removed successfully.`)
      setTimeout(() => setProductActionMessage(''), 4000)
      loadDashboard()
    } catch (err) {
      alert(err.message || 'Failed to delete product.')
    } finally {
      setUpdatingStockId('')
    }
  }

  const handleProductInputChange = (e) => {
    const { name, value } = e.target
    setProductForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleAddProductSubmit = async (e) => {
    e.preventDefault()
    setProductSuccess('')
    setProductError('')

    if (!imageFile) {
      setProductError('Product image is required.')
      return
    }

    setSubmittingProduct(true)
    try {
      const formData = new FormData()
      formData.append('name', productForm.name)
      formData.append('price', productForm.price)
      formData.append('category', productForm.category)
      formData.append('stock', productForm.stock)
      formData.append('description', productForm.description)
      formData.append('tags', productForm.tags)
      formData.append('image', imageFile)

      await createProduct(formData)
      setProductSuccess('Product added successfully!')
      setProductForm({
        name: '',
        price: '',
        category: 'Electronics',
        stock: '',
        description: '',
        tags: '',
      })
      setImageFile(null)
      if (e.target.image) e.target.image.value = ''
      loadDashboard()
    } catch (err) {
      setProductError(err.message || 'Failed to add product.')
    } finally {
      setSubmittingProduct(false)
    }
  }

  const outOfStockCount = products.filter((p) => p.stock === 0).length
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length

  return (
    <main className="admin-dashboard">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">TapMart Admin</p>
          <h1>Management Portal</h1>
        </div>
        <button className="admin-refresh" type="button" onClick={loadDashboard}>Refresh Data</button>
      </div>

      <nav className="admin-tabs" aria-label="Admin tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics & Overview
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'manage-products' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage-products')}
        >
          Manage Inventory ({products.length})
          {outOfStockCount > 0 && <span className="tab-badge warning">{outOfStockCount} Out of Stock</span>}
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'add-product' ? 'active' : ''}`}
          onClick={() => setActiveTab('add-product')}
        >
          + Add New Product
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Manage Orders ({orders.length})
        </button>
      </nav>

      {error && <p className="admin-message admin-error" role="alert">{error}</p>}

      {!error && (
        <>
          {/* Analytics Overview Tab */}
          {activeTab === 'analytics' && (
            <section className="admin-stats-section">
              <h2>Analytics Overview</h2>
              <div className="admin-stats" aria-label="Dashboard statistics">
                <div><span>Total Orders</span><strong>{stats?.totalOrders || 0}</strong></div>
                <div><span>Registered Users</span><strong>{stats?.totalUsers || 0}</strong></div>
                <div><span>Total Products</span><strong>{products.length || stats?.totalProducts || 0}</strong></div>
                <div><span>Total Revenue (Delivered)</span><strong>{formatCurrency(stats?.totalRevenue || 0)}</strong></div>
              </div>

              {outOfStockCount > 0 && (
                <div className="admin-alert error" style={{ marginTop: '20px' }}>
                  ⚠️ <strong>Attention needed:</strong> You have {outOfStockCount} product(s) out of stock! Go to the <strong>Manage Inventory</strong> tab to add quantity.
                </div>
              )}
            </section>
          )}

          {/* Manage Products & Inventory Tab */}
          {activeTab === 'manage-products' && (
            <section className="admin-inventory-section">
              <div className="inventory-header">
                <h2>Product Inventory ({products.length})</h2>
                <div className="inventory-badges">
                  {outOfStockCount > 0 && <span className="badge badge-out-stock">{outOfStockCount} Out of Stock</span>}
                  {lowStockCount > 0 && <span className="badge badge-low-stock">{lowStockCount} Low Stock</span>}
                </div>
              </div>

              {productActionMessage && (
                <div className="admin-alert success" role="status">
                  {productActionMessage}
                </div>
              )}

              {products.length === 0 ? (
                <p className="admin-message">No products found in store. Use "+ Add New Product" to add products.</p>
              ) : (
                <div className="inventory-grid">
                  {products.map((product) => {
                    const isOutOfStock = product.stock === 0
                    const isLowStock = product.stock > 0 && product.stock <= 5
                    const isUpdating = updatingStockId === product._id

                    return (
                      <article className={`inventory-card ${isOutOfStock ? 'out-of-stock-card' : ''}`} key={product._id}>
                        <div className="inventory-img-wrapper">
                          <img src={product.imageURL} alt={product.name} />
                          {isOutOfStock ? (
                            <span className="stock-status-pill out">OUT OF STOCK</span>
                          ) : isLowStock ? (
                            <span className="stock-status-pill low">LOW STOCK ({product.stock})</span>
                          ) : (
                            <span className="stock-status-pill available">IN STOCK ({product.stock})</span>
                          )}
                        </div>

                        <div className="inventory-details">
                          <h3>{product.name}</h3>
                          <p className="category">{product.category}</p>
                          <p className="price">{formatCurrency(product.price)}</p>

                          <div className="stock-controls">
                            <label htmlFor={`stock-input-${product._id}`}>Quantity In Stock:</label>
                            <div className="stock-input-row">
                              <input
                                id={`stock-input-${product._id}`}
                                type="number"
                                min="0"
                                value={editingStock[product._id] ?? product.stock}
                                onChange={(e) => handleStockInputChange(product._id, e.target.value)}
                                disabled={isUpdating}
                              />
                              <button
                                type="button"
                                className="save-stock-btn"
                                onClick={() => handleSaveStock(product)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? 'Saving...' : 'Save'}
                              </button>
                            </div>

                            <div className="quick-add-buttons">
                              <span>Quick Add:</span>
                              <button
                                type="button"
                                className="quick-btn"
                                onClick={() => handleQuickAddStock(product, 10)}
                                disabled={isUpdating}
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                className="quick-btn"
                                onClick={() => handleQuickAddStock(product, 50)}
                                disabled={isUpdating}
                              >
                                +50
                              </button>
                              <button
                                type="button"
                                className="quick-btn"
                                onClick={() => handleQuickAddStock(product, 100)}
                                disabled={isUpdating}
                              >
                                +100
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="delete-product-btn"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isUpdating}
                          >
                            Delete Product
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {/* Add Product Tab */}
          {activeTab === 'add-product' && (
            <section className="admin-add-product-section">
              <h2>Add New Product</h2>
              {productSuccess && <div className="admin-alert success" role="status">{productSuccess}</div>}
              {productError && <div className="admin-alert error" role="alert">{productError}</div>}

              <form className="admin-product-form" onSubmit={handleAddProductSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="product-name">Product Name *</label>
                    <input
                      id="product-name"
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Wireless Headphones"
                      value={productForm.name}
                      onChange={handleProductInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="product-price">Price (₹) *</label>
                    <input
                      id="product-price"
                      type="number"
                      name="price"
                      min="1"
                      step="1"
                      required
                      placeholder="e.g. 1499"
                      value={productForm.price}
                      onChange={handleProductInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="product-category">Category *</label>
                    <select
                      id="product-category"
                      name="category"
                      value={productForm.category}
                      onChange={handleProductInputChange}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="product-stock">Initial Stock Quantity *</label>
                    <input
                      id="product-stock"
                      type="number"
                      name="stock"
                      min="0"
                      required
                      placeholder="e.g. 50"
                      value={productForm.stock}
                      onChange={handleProductInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="product-description">Description *</label>
                  <textarea
                    id="product-description"
                    name="description"
                    rows="4"
                    required
                    placeholder="Enter detailed product description..."
                    value={productForm.description}
                    onChange={handleProductInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product-tags">Tags (comma separated)</label>
                  <input
                    id="product-tags"
                    type="text"
                    name="tags"
                    placeholder="e.g. bluetooth, audio, wireless"
                    value={productForm.tags}
                    onChange={handleProductInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product-image">Product Image *</label>
                  <input
                    id="product-image"
                    type="file"
                    name="image"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                  />
                  <small className="form-hint">Upload high quality PNG, JPG, or WebP image.</small>
                </div>

                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={submittingProduct}
                >
                  {submittingProduct ? 'Uploading & Creating Product...' : 'Add Product to Store'}
                </button>
              </form>
            </section>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <section className="admin-orders">
              <h2>Customer Orders ({orders.length})</h2>
              {orders.length === 0 ? (
                <p className="admin-message">No orders placed yet.</p>
              ) : (
                orders.map((order) => (
                  <article className="admin-order" key={order._id}>
                    <div>
                      <strong>#{order._id.slice(-8)}</strong>
                      <span>{order.user?.name || 'Customer'} · {new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                      <span>{order.orderItems.map((item) => `${item.name} x ${item.qty}`).join(', ')}</span>
                    </div>
                    <strong>{formatCurrency(order.totalPrice)}</strong>
                    <label>
                      Status
                      <select
                        value={order.status}
                        disabled={updatingId === order._id}
                        onChange={(event) => changeStatus(order._id, event.target.value)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-payment">
                      <span>{order.paymentStatus}</span>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default AdminDashboard
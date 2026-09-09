import { useState } from 'react'
import { formatCurrency } from '../../utils/currency'
import { deleteProduct, updateProduct } from '../../services/api'

const InventoryManager = ({ products, setProducts, onReload }) => {
  const [editingStock, setEditingStock] = useState(() => {
    const stockMap = {}
    products.forEach((product) => { stockMap[product._id || product.id] = product.stock })
    return stockMap
  })
  const [updatingStockId, setUpdatingStockId] = useState('')
  const [productActionMessage, setProductActionMessage] = useState('')

  const saveStock = async (product, customStock = null) => {
    const newStock = customStock !== null ? customStock : Number(editingStock[product._id])
    if (Number.isNaN(newStock) || newStock < 0) {
      alert('Please enter a valid non-negative stock number.')
      return
    }
    setUpdatingStockId(product._id)
    try {
      const updated = await updateProduct(product._id, { stock: newStock })
      setProducts((current) => current.map((item) => item._id === product._id ? { ...item, stock: updated.stock } : item))
      setEditingStock((current) => ({ ...current, [product._id]: updated.stock }))
      setProductActionMessage(`Stock for "${product.name}" updated to ${updated.stock} units!`)
      setTimeout(() => setProductActionMessage(''), 4000)
    } catch (requestError) {
      alert(requestError.message || 'Failed to update stock.')
    } finally {
      setUpdatingStockId('')
    }
  }

  const removeProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return
    setUpdatingStockId(product._id)
    try {
      await deleteProduct(product._id)
      setProducts((current) => current.filter((item) => item._id !== product._id))
      setProductActionMessage(`Product "${product.name}" removed successfully.`)
      setTimeout(() => setProductActionMessage(''), 4000)
      onReload()
    } catch (requestError) {
      alert(requestError.message || 'Failed to delete product.')
    } finally {
      setUpdatingStockId('')
    }
  }

  const outOfStockCount = products.filter((product) => product.stock === 0).length
  const lowStockCount = products.filter((product) => product.stock > 0 && product.stock <= 5).length

  return (
    <section className="admin-inventory-section">
      <div className="inventory-header"><h2>Product Inventory ({products.length})</h2><div className="inventory-badges">{outOfStockCount > 0 && <span className="badge badge-out-stock">{outOfStockCount} Out of Stock</span>}{lowStockCount > 0 && <span className="badge badge-low-stock">{lowStockCount} Low Stock</span>}</div></div>
      {productActionMessage && <div className="admin-alert success" role="status">{productActionMessage}</div>}
      {products.length === 0 ? <p className="admin-message">No products found in store. Use "+ Add New Product" to add products.</p> : (
        <div className="inventory-grid">
          {products.map((product) => {
            const isOutOfStock = product.stock === 0
            const isLowStock = product.stock > 0 && product.stock <= 5
            const isUpdating = updatingStockId === product._id
            return (
              <article className={`inventory-card ${isOutOfStock ? 'out-of-stock-card' : ''}`} key={product._id}>
                <div className="inventory-img-wrapper"><img src={product.imageURL} alt={product.name} /><span className={`stock-status-pill ${isOutOfStock ? 'out' : isLowStock ? 'low' : 'available'}`}>{isOutOfStock ? 'OUT OF STOCK' : isLowStock ? `LOW STOCK (${product.stock})` : `IN STOCK (${product.stock})`}</span></div>
                <div className="inventory-details">
                  <h3>{product.name}</h3><p className="category">{product.category}</p><p className="price">{formatCurrency(product.price)}</p>
                  <div className="stock-controls"><label htmlFor={`stock-input-${product._id}`}>Quantity In Stock:</label><div className="stock-input-row"><input id={`stock-input-${product._id}`} type="number" min="0" value={editingStock[product._id] ?? product.stock} onChange={(event) => setEditingStock((current) => ({ ...current, [product._id]: event.target.value }))} disabled={isUpdating} /><button type="button" className="save-stock-btn" onClick={() => saveStock(product)} disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save'}</button></div><div className="quick-add-buttons"><span>Quick Add:</span>{[10, 50, 100].map((quantity) => <button type="button" className="quick-btn" onClick={() => saveStock(product, (product.stock || 0) + quantity)} disabled={isUpdating} key={quantity}>+{quantity}</button>)}</div></div>
                  <button type="button" className="delete-product-btn" onClick={() => removeProduct(product)} disabled={isUpdating}>Delete Product</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default InventoryManager
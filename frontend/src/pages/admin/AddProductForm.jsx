import { useState } from 'react'
import { createProduct } from '../../services/api'

const categories = ['Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home & Kitchen', 'Beauty', 'Sports', 'Other']
const emptyForm = { name: '', price: '', category: 'Electronics', stock: '', description: '', tags: '' }

const AddProductForm = ({ onReload }) => {
  const [productForm, setProductForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [submittingProduct, setSubmittingProduct] = useState(false)
  const [productSuccess, setProductSuccess] = useState('')
  const [productError, setProductError] = useState('')
  const updateField = (event) => setProductForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault(); setProductSuccess(''); setProductError('')
    if (!imageFile) { setProductError('Product image is required.'); return }
    setSubmittingProduct(true)
    try {
      const formData = new FormData()
      Object.entries(productForm).forEach(([key, value]) => formData.append(key, value))
      formData.append('image', imageFile)
      await createProduct(formData)
      setProductSuccess('Product added successfully!'); setProductForm(emptyForm); setImageFile(null); event.target.image.value = ''; onReload()
    } catch (requestError) { setProductError(requestError.message || 'Failed to add product.') } finally { setSubmittingProduct(false) }
  }

  return (
    <section className="admin-add-product-section">
      <h2>Add New Product</h2>
      {productSuccess && <div className="admin-alert success" role="status">{productSuccess}</div>}{productError && <div className="admin-alert error" role="alert">{productError}</div>}
      <form className="admin-product-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field id="product-name" label="Product Name *" name="name" value={productForm.name} onChange={updateField} placeholder="e.g. Wireless Headphones" required />
          <Field id="product-price" label="Price (₹) *" name="price" type="number" value={productForm.price} onChange={updateField} placeholder="e.g. 1499" required />
          <div className="form-group"><label htmlFor="product-category">Category *</label><select id="product-category" name="category" value={productForm.category} onChange={updateField}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <Field id="product-stock" label="Initial Stock Quantity *" name="stock" type="number" value={productForm.stock} onChange={updateField} placeholder="e.g. 50" required />
        </div>
        <div className="form-group"><label htmlFor="product-description">Description *</label><textarea id="product-description" name="description" rows="4" required placeholder="Enter detailed product description..." value={productForm.description} onChange={updateField} /></div>
        <Field id="product-tags" label="Tags (comma separated)" name="tags" value={productForm.tags} onChange={updateField} placeholder="e.g. bluetooth, audio, wireless" />
        <div className="form-group"><label htmlFor="product-image">Product Image *</label><input id="product-image" type="file" name="image" accept="image/*" required onChange={(event) => setImageFile(event.target.files?.[0] || null)} /><small className="form-hint">Upload high quality PNG, JPG, or WebP image.</small></div>
        <button type="submit" className="admin-submit-btn" disabled={submittingProduct}>{submittingProduct ? 'Uploading & Creating Product...' : 'Add Product to Store'}</button>
      </form>
    </section>
  )
}

const Field = ({ id, label, name, type = 'text', value, onChange, placeholder, required = false }) => <div className="form-group"><label htmlFor={id}>{label}</label><input id={id} type={type} name={name} min={type === 'number' ? '0' : undefined} required={required} placeholder={placeholder} value={value} onChange={onChange} /></div>

export default AddProductForm